import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams;
  const hasError = sp.error === 'true';
  const errorMessage = sp.message as string;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background-main)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>Sistema de Cobro ERP</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ingrese sus credenciales de empleado</p>
        </div>

        {hasError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger-color)',
            color: 'var(--danger-color)',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {errorMessage || 'Error al iniciar sesión'}
          </div>
        )}

        <form action={login}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Nombre de Usuario</label>
            <input 
              className="form-control" 
              id="username" 
              name="username" 
              type="text" 
              placeholder="Ej. admin"
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input 
              className="form-control" 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}
