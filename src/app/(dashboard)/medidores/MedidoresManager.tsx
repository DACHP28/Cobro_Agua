'use client'

import { useState, useMemo } from 'react';
import { Medidor, Cliente } from '@/types/database.types';
import FormMedidor from './FormMedidor';
import { toggleEstadoMedidor } from './actions';

// Helper para ignorar acentos, mayúsculas y espacios al realizar la búsqueda
function normalizarTexto(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function MedidoresManager({ initialMedidores, clientesActivos }: { initialMedidores: Medidor[], clientesActivos: Cliente[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingMedidor, setEditingMedidor] = useState<Medidor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');

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

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroEstado('todos');
  };

  // Conteo inteligente por estados
  const conteoActivos = initialMedidores.filter(m => m.estado === 'activo').length;
  const conteoInactivos = initialMedidores.length - conteoActivos;

  // Filtrado reactivo en tiempo real
  const medidoresFiltrados = useMemo(() => {
    const query = normalizarTexto(searchTerm);

    return initialMedidores.filter(medidor => {
      // 1. Filtro de Estado
      if (filtroEstado === 'activo' && medidor.estado !== 'activo') return false;
      if (filtroEstado === 'inactivo' && medidor.estado === 'activo') return false;

      // 2. Filtro por Texto inteligente en múltiples campos
      if (!query) return true;

      const numero = normalizarTexto(medidor.numero);
      const servicio = normalizarTexto(medidor.tipo_servicio);
      const observaciones = normalizarTexto(medidor.observaciones);
      
      let nombrePropietario = '';
      let cedulaPropietario = '';
      if (medidor.clientes) {
        nombrePropietario = normalizarTexto(`${medidor.clientes.nombre} ${medidor.clientes.apellido}`);
        cedulaPropietario = normalizarTexto(medidor.clientes.cedula);
      }

      return (
        numero.includes(query) ||
        nombrePropietario.includes(query) ||
        cedulaPropietario.includes(query) ||
        servicio.includes(query) ||
        observaciones.includes(query)
      );
    });
  }, [initialMedidores, searchTerm, filtroEstado]);

  return (
    <div>
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Control y Directorio de Medidores</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Supervisa el parque de medidores, busca por número o nombre del titular y gestiona instalaciones al instante.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)', borderRadius: '30px' }} 
          onClick={() => setShowModal(true)}
        >
          + Nuevo Medidor
        </button>
      </div>

      {/* Panel de Búsqueda y Filtros de Estado */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Barra de búsqueda interactiva con Lupa */}
          <div style={{ position: 'relative', flex: '1 1 350px', minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por núm. medidor, propietario, cédula o tipo servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                paddingLeft: '2.7rem', 
                paddingRight: searchTerm ? '2.5rem' : '1rem', 
                height: '44px', 
                fontSize: '0.95rem', 
                borderRadius: '30px',
                border: '1.5px solid var(--border-color)',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--secondary-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Botones y Píldoras de Filtro por Estado */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFiltroEstado('todos')}
              className="btn"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                backgroundColor: filtroEstado === 'todos' ? 'var(--primary-color)' : 'var(--secondary-color)',
                color: filtroEstado === 'todos' ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontWeight: filtroEstado === 'todos' ? 600 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              Todos ({initialMedidores.length})
            </button>
            <button
              onClick={() => setFiltroEstado('activo')}
              className="btn"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                backgroundColor: filtroEstado === 'activo' ? 'var(--success-color)' : 'var(--secondary-color)',
                color: filtroEstado === 'activo' ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontWeight: filtroEstado === 'activo' ? 600 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              Activos ({conteoActivos})
            </button>
            <button
              onClick={() => setFiltroEstado('inactivo')}
              className="btn"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                backgroundColor: filtroEstado === 'inactivo' ? 'var(--danger-color)' : 'var(--secondary-color)',
                color: filtroEstado === 'inactivo' ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontWeight: filtroEstado === 'inactivo' ? 600 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              Inactivos / Susp. ({conteoInactivos})
            </button>
          </div>
        </div>

        {/* Indicador de Resultados */}
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
          <span>
            Mostrando <strong>{medidoresFiltrados.length}</strong> de <strong>{initialMedidores.length}</strong> medidores operativos
            {searchTerm && <span> para la búsqueda: &laquo;<strong>{searchTerm}</strong>&raquo;</span>}
          </span>
          {(searchTerm !== '' || filtroEstado !== 'todos') && (
            <button
              onClick={limpiarFiltros}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 600 }}
            >
              🔄 Restablecer todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Medidores */}
      <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Número (Serial)</th>
              <th>Propietario / Titular</th>
              <th>Tipo Servicio</th>
              <th>Fecha Instalación</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones Rápida</th>
            </tr>
          </thead>
          <tbody>
            {medidoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>💧</div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.2rem' }}>No se encontraron medidores</h4>
                  <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.9rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Ningún medidor ni propietario coincide con los criterios <strong>&laquo;{searchTerm || (filtroEstado !== 'todos' ? filtroEstado : '')}&raquo;</strong>.
                  </p>
                  <button className="btn btn-outline" onClick={limpiarFiltros} style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem', borderRadius: '20px' }}>
                    Limpiar filtros de búsqueda
                  </button>
                </td>
              </tr>
            ) : (
              medidoresFiltrados.map(medidor => (
                <tr key={medidor.id} style={{ transition: 'background-color 0.15s ease' }}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'var(--secondary-color)', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.95rem', border: '1px solid var(--border-color)', color: 'var(--primary-color)' }}>
                      {medidor.numero}
                    </span>
                  </td>
                  <td>
                    {medidor.clientes ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {medidor.clientes.nombre} {medidor.clientes.apellido}
                        </div>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          🪪 {medidor.clientes.cedula}
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Sin Asignar</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                      {medidor.tipo_servicio}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {medidor.fecha_instalacion ? medidor.fecha_instalacion.split('T')[0] : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${medidor.estado === 'activo' ? 'badge-success' : medidor.estado === 'inactivo' ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                      {medidor.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', fontWeight: 600, backgroundColor: '#fff' }} 
                        onClick={() => handleEdit(medidor)}
                        title="Modificar datos u observ. de este medidor"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ 
                          padding: '0.35rem 0.8rem', 
                          fontSize: '0.8rem', 
                          borderRadius: '8px', 
                          fontWeight: 600,
                          backgroundColor: '#fff',
                          color: medidor.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)', 
                          borderColor: medidor.estado === 'activo' ? 'var(--danger-color)' : 'var(--success-color)' 
                        }} 
                        onClick={() => handleToggleEstado(medidor.id, medidor.estado)}
                        title={medidor.estado === 'activo' ? 'Suspender medidor' : 'Reactivar medidor'}
                      >
                        {medidor.estado === 'activo' ? '🚫 Suspender' : '✅ Activar'}
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
        <FormMedidor medidorInicial={editingMedidor} clientesActivos={clientesActivos} onClose={handleCloseModal} />
      )}
    </div>
  );
}
