import { ReactNode } from 'react'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/login/actions'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('erp_session');
  let role = 'CAJERO';
  let userName = 'Usuario';
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      role = session.role;
      userName = session.name;
    } catch (e) {
      // Ignorar
    }
  }

  // Lógica de visualización de menú según Rol
  const showUsuarios = role === 'ADMINISTRADOR';
  const showInventario = role === 'ADMINISTRADOR' || role === 'SUPERVISOR';
  const showEgresos = role === 'ADMINISTRADOR' || role === 'SUPERVISOR';
  const showReportes = role === 'ADMINISTRADOR' || role === 'SUPERVISOR';
  const showOperaciones = role === 'ADMINISTRADOR' || role === 'SUPERVISOR' || role === 'OPERADOR';
  const showCobros = role === 'ADMINISTRADOR' || role === 'SUPERVISOR' || role === 'CAJERO';

  return (
    <div className="layout">
      <aside className="sidebar no-print">
        <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Image src="/logo.png" alt="Logo Junta de Agua" width={80} height={80} style={{ objectFit: 'contain' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)', lineHeight: '1.2', marginBottom: '1rem' }}>
            Junta Administradora de Agua Potable y Saneamiento
          </h1>
        </div>
        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' }}>
          {showUsuarios && (
            <Link href="/usuarios" className="nav-item">Usuarios (Personal)</Link>
          )}
          
          <Link href="/" className="nav-item">Dashboard</Link>
          
          {showOperaciones && (
            <>
              <Link href="/clientes" className="nav-item">Clientes</Link>
              <Link href="/medidores" className="nav-item">Medidores</Link>
              <Link href="/multas" className="nav-item">Multas</Link>
              <Link href="/consumos" className="nav-item">Consumos</Link>
            </>
          )}

          {showCobros && (
            <Link href="/cobros" className="nav-item">Cobros (Ventanilla)</Link>
          )}

          {showReportes && (
            <Link href="/reportes" className="nav-item">Reportes</Link>
          )}

          {showInventario && (
            <Link href="/inventario" className="nav-item">Inventario</Link>
          )}
          
          {showEgresos && (
            <Link href="/egresos" className="nav-item">Egresos</Link>
          )}
        </nav>

      </aside>
      
      <main className="main-content">
        <header className="no-print" style={{ 
          padding: '1rem 2rem', 
          backgroundColor: 'white', 
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Sistema de Gestión</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {userName} ({role})
              </span>
              <form action={logout}>
                <button type="submit" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  Cerrar Sesión
                </button>
              </form>
            </div>
          </div>
        </header>
        <div style={{ padding: '0 2rem' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
