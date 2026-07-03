'use client'

import { useState } from 'react';
import { Medidor, Cliente } from '@/types/database.types';
import FormMedidor from './FormMedidor';
import { toggleEstadoMedidor } from './actions';

export default function MedidoresManager({ initialMedidores, clientesActivos }: { initialMedidores: Medidor[], clientesActivos: Cliente[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingMedidor, setEditingMedidor] = useState<Medidor | null>(null);

  const handleEdit = (medidor: Medidor) => {
    setEditingMedidor(medidor);
    setShowModal(true);
  };

  const handleToggleEstado = async (id: number, estadoActual: string) => {
    if (confirm(`¿Está seguro de cambiar el estado de este medidor?`)) {
      await toggleEstadoMedidor(id, estadoActual);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedidor(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Control de Medidores</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Medidor</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Número (Serial)</th>
              <th>Propietario Asignado</th>
              <th>Servicio</th>
              <th>Instalación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialMedidores.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay medidores registrados.</td>
              </tr>
            ) : (
              initialMedidores.map(medidor => (
                <tr key={medidor.id}>
                  <td><strong>{medidor.numero}</strong></td>
                  <td>
                    {medidor.clientes ? (
                      <>{medidor.clientes.nombre} {medidor.clientes.apellido}<br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{medidor.clientes.cedula}</span></>
                    ) : (
                      <span style={{ color: 'var(--danger-color)' }}>No Asignado</span>
                    )}
                  </td>
                  <td>
                    {medidor.tipo_servicio}
                  </td>
                  <td>{medidor.fecha_instalacion ? medidor.fecha_instalacion.split('T')[0] : 'N/A'}</td>
                  <td>
                    <span className={`badge ${medidor.estado === 'activo' ? 'badge-success' : medidor.estado === 'inactivo' ? 'badge-danger' : 'badge-warning'}`}>
                      {medidor.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleEdit(medidor)}>
                      Editar
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: medidor.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)', borderColor: medidor.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)' }} 
                      onClick={() => handleToggleEstado(medidor.id, medidor.estado)}
                    >
                      {medidor.estado === 'activo' ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <FormMedidor medidorInicial={editingMedidor} clientesActivos={clientesActivos} onClose={handleCloseModal} />
      )}
    </div>
  );
}
