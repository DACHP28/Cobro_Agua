'use client'

import { useState } from 'react';
import { Usuario } from '@/types/database.types';
import { createUsuario, editUsuario, toggleEstadoUsuario } from './actions';

export default function UsuariosManager({ usuarios }: { usuarios: Usuario[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const roles = [
    { id: 'ADMINISTRADOR', label: 'Administrador (Control Total)' },
    { id: 'SUPERVISOR', label: 'Supervisor (Control Total menos Usuarios)' },
    { id: 'OPERADOR', label: 'Operador (Clientes, Medidores, Multas, Consumos)' },
    { id: 'CAJERO', label: 'Cajero (Solo Cobros)' }
  ];

  const handleOpenCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: Usuario) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const password = formData.get('password') as string;
    
    const inputData = {
      username: formData.get('username') as string,
      full_name: formData.get('full_name') as string,
      role: formData.get('role') as string,
      is_active: true
    };

    let res;
    if (editingUser) {
      res = await editUsuario(editingUser.id, inputData, password);
    } else {
      res = await createUsuario(inputData, password);
    }

    if (res.error) {
      alert('Error al guardar usuario: ' + res.error);
    } else {
      setShowModal(false);
    }
    
    setLoading(false);
  };

  const handleToggleEstado = async (id: number, currentEstado: boolean) => {
    if (!confirm(`¿Está seguro de ${currentEstado ? 'desactivar' : 'activar'} este usuario?`)) return;
    setLoading(true);
    const res = await toggleEstadoUsuario(id, currentEstado);
    if (res.error) alert('Error: ' + res.error);
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Gestión de Personal y Accesos</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Administra los roles y usuarios que acceden al sistema.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>+ Nuevo Empleado</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre del Empleado</th>
              <th>Usuario (Login)</th>
              <th>Rol / Permisos</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay usuarios registrados.</td>
              </tr>
            ) : (
              usuarios.map(user => (
                <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.6 }}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.username}</td>
                  <td>
                    <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.is_active ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleOpenEdit(user)}
                        disabled={loading}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: user.is_active ? 'var(--danger-color)' : 'var(--success-color)' }}
                        onClick={() => handleToggleEstado(user.id, user.is_active)}
                        disabled={loading || user.username === 'admin'}
                      >
                        {user.is_active ? 'Suspender' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              {editingUser ? 'Editar Empleado' : 'Registrar Empleado'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  name="full_name" 
                  className="form-control" 
                  required 
                  defaultValue={editingUser?.full_name || ''} 
                  placeholder="Ej. Juan Pérez" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre de Usuario (Login)</label>
                <input 
                  type="text" 
                  name="username" 
                  className="form-control" 
                  required 
                  defaultValue={editingUser?.username || ''}
                  readOnly={editingUser?.username === 'admin'}
                  placeholder="Ej. jperez" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}
                </label>
                <input 
                  type="text" 
                  name="password" 
                  className="form-control" 
                  required={!editingUser}
                  placeholder="Ingrese una clave segura" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de Acceso (Rol)</label>
                {editingUser?.username === 'admin' ? (
                  <>
                    <input type="hidden" name="role" value="ADMINISTRADOR" />
                    <select className="form-control" disabled defaultValue="ADMINISTRADOR">
                      <option value="ADMINISTRADOR">Administrador (Control Total)</option>
                    </select>
                  </>
                ) : (
                  <select 
                    name="role" 
                    className="form-control" 
                    required
                    defaultValue={editingUser?.role || 'OPERADOR'}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Procesando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
