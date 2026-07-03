'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Usuario, UsuarioInput } from '@/types/database.types'
import bcrypt from 'bcryptjs'

export async function getUsuarios(): Promise<Usuario[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('id, username, full_name, role, is_active, last_login, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching usuarios:', error)
    return []
  }

  return data as unknown as Usuario[]
}

export async function createUsuario(input: UsuarioInput, rawPassword?: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  let hash = '';
  if (rawPassword) {
    const salt = await bcrypt.genSalt(10);
    hash = await bcrypt.hash(rawPassword, salt);
  } else {
    return { error: 'Contraseña requerida' }
  }

  const { error } = await supabase.from('usuarios_sistema').insert({
    username: input.username,
    full_name: input.full_name,
    role: input.role,
    password_hash: hash,
    is_active: input.is_active !== undefined ? input.is_active : true
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'El nombre de usuario ya existe' }
    }
    return { error: error.message }
  }

  revalidatePath('/usuarios')
  return { error: null }
}

export async function editUsuario(id: number, input: UsuarioInput, rawPassword?: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const updateData: any = {
    username: input.username,
    full_name: input.full_name,
    role: input.role,
  }

  if (rawPassword && rawPassword.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    updateData.password_hash = await bcrypt.hash(rawPassword, salt);
  }

  const { error } = await supabase.from('usuarios_sistema').update(updateData).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/usuarios')
  return { error: null }
}

export async function toggleEstadoUsuario(id: number, currentEstado: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('usuarios_sistema')
    .update({ is_active: !currentEstado })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/usuarios')
  return { error: null }
}
