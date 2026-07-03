import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Primero corremos el middleware de Supabase por si se usa en el backend
  const response = await updateSession(request)

  const path = request.nextUrl.pathname

  // Permitir archivos estáticos y login
  if (
    path.startsWith('/_next') ||
    path.startsWith('/login') ||
    path.includes('.')
  ) {
    return response
  }

  // 1. Verificar si existe la sesión personalizada
  const sessionCookie = request.cookies.get('erp_session')
  
  if (!sessionCookie) {
    // Si no hay sesión, redirigir al login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    const role = session.role || 'CAJERO'

    // 2. Control de Acceso Basado en Roles (RBAC)
    // Definimos qué rutas ESTÁN PROHIBIDAS para cada rol
    const isRestricted = () => {
      if (role === 'ADMINISTRADOR') {
        return false; // Tiene acceso a todo
      }
      if (role === 'SUPERVISOR') {
        return path.startsWith('/usuarios'); // Prohibido usuarios
      }
      if (role === 'OPERADOR') {
        // Operador SOLO puede acceder a estas, si no está en la lista, prohibido
        const allowed = ['/', '/clientes', '/medidores', '/consumos', '/multas'];
        return !allowed.some(route => path === route || path.startsWith(route + '/'));
      }
      if (role === 'CAJERO') {
        // Cajero SOLO puede acceder a cobros, comprobantes y al dashboard
        const allowed = ['/', '/cobros', '/comprobante'];
        return !allowed.some(route => path === route || path.startsWith(route + '/'));
      }
      
      return true; // Por defecto bloquear si hay error
    }

    if (isRestricted()) {
      // Si el rol no tiene permiso, lo mandamos al dashboard
      return NextResponse.redirect(new URL('/', request.url))
    }

  } catch (error) {
    // Si la cookie es inválida, forzar login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
