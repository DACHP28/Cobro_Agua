'use client'

import { useState } from 'react';
import { Cliente } from '@/types/database.types';
import FormCliente from './FormCliente';
import { toggleEstadoCliente } from './actions';

export default function ClientesManager({ initialClientes }: { initialClientes: Cliente[] }) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // El estado se sincroniza al recargar o tras un Server Action porque page.tsx re-pasa las props,
  // pero podemos simplemente usar las props directamente si preferimos que Next.js maneje el cache.
  // Como usamos Server Actions con revalidatePath, al terminar la accion, Next.js refresca la data
  // y re-renderiza con nuevas props `initialClientes`.
  
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleToggleEstado = async (id: number, estadoActual: string) => {
    if (confirm(`¿Está seguro de cambiar el estado de este cliente?`)) {
      await toggleEstadoCliente(id, estadoActual);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Directorio de Clientes</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Cliente</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Cédula</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialClientes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay clientes registrados.</td>
              </tr>
            ) : (
              initialClientes.map(cliente => (
                <tr key={cliente.id}>
                  <td><strong>{cliente.codigo}</strong></td>
                  <td>{cliente.nombre} {cliente.apellido}</td>
                  <td>{cliente.cedula}</td>
                  <td>
                    {cliente.telefono || '-'}<br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cliente.email}</span>
                  </td>
                  <td>
                    <span className={`badge ${cliente.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                      {cliente.estado}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleEdit(cliente)}>
                      Editar
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: cliente.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)', borderColor: cliente.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)' }} 
                      onClick={() => handleToggleEstado(cliente.id, cliente.estado)}
                    >
                      {cliente.estado === 'activo' ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <FormCliente clienteInicial={editingCliente} onClose={handleCloseModal} />
      )}
    </div>
  );
}
