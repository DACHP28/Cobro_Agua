'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect('/login?error=true&message=' + encodeURIComponent('Usuario y contraseña requeridos'))
  }

  // 1. Buscar usuario en BD
  const { data: users, error } = await supabase
    .from('usuarios_sistema')
    .select('*')
    .eq('username', username)
    .limit(1)

  if (error || !users || users.length === 0) {
    redirect('/login?error=true&message=' + encodeURIComponent('Usuario no encontrado o credenciales inválidas'))
  }

  const user = users[0];

  // 2. Verificar estado activo
  if (!user.is_active) {
    redirect('/login?error=true&message=' + encodeURIComponent('Cuenta de usuario suspendida'))
  }

  // 3. Verificar contraseña
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    redirect('/login?error=true&message=' + encodeURIComponent('Contraseña incorrecta'))
  }

  // 4. Actualizar último login
  await supabase.from('usuarios_sistema').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  // 5. Crear sesión manual (Cookie)
  const cookieStore = await cookies()
  cookieStore.set('erp_session', JSON.stringify({ id: user.id, username: user.username, role: user.role, name: user.full_name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 semana
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('erp_session')
  redirect('/login')
}
