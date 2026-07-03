'use client'

import { useState } from 'react';
import { Multa, Cliente, MultaInput } from '@/types/database.types';
import { createMultaManual, registrarPagoMulta, anularMulta, updateConfiguracionMultas, auditarMorosos } from './actions';

export default function MultasManager({ initialMultas, clientes, initialConfig }: { initialMultas: Multa[], clientes: Cliente[], initialConfig: { mesesTolerancia: number, montoFijo: number } }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [auditMsg, setAuditMsg] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  const [clienteId, setClienteId] = useState<number | ''>('');
  const [categoria, setCategoria] = useState('minga');
  const [monto, setMonto] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');

  const [mesesTol, setMesesTol] = useState(initialConfig.mesesTolerancia);
  const [montoFij, setMontoFij] = useState(initialConfig.montoFijo);

  const handleCrearMulta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (clienteId === '' || monto === '' || monto <= 0) return;

    setLoading(true);
    setErrorMsg('');

    const input: MultaInput = {
      cliente_id: clienteId,
      categoria_multa: categoria,
      monto_generado: monto,
      motivo: motivo,
    };

    const result = await createMultaManual(input);

    if (result.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else {
      setShowModal(false);
      setLoading(false);
      setClienteId('');
      setCategoria('minga');
      setMonto('');
      setMotivo('');
    }
  };

  const handlePagar = async (id: number) => {
    if (!confirm('¿Confirmar el pago de esta multa?')) return;
    await registrarPagoMulta(id);
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Está seguro de anular/perdonar esta multa?')) return;
    await anularMulta(id);
  };

  const handleGuardarConfig = async () => {
    setLoading(true);
    await updateConfiguracionMultas(mesesTol, montoFij);
    setLoading(false);
    alert('Configuración guardada correctamente.');
  };

  const handleAuditar = async () => {
    if (!confirm('¿Desea escanear todas las facturas impagas y generar las multas por retraso correspondientes?')) return;
    
    setLoading(true);
    setAuditMsg(null);
    const res = await auditarMorosos();
    setLoading(false);

    if (res.error) {
      setAuditMsg({ tipo: 'error', texto: res.error });
    } else {
      setAuditMsg({ tipo: 'success', texto: `Auditoría completada. Se generaron ${res.resultados.generadas} multas por retraso.` });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Gestión de Multas y Recargos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Registrar Multa Manual</button>
      </div>

      {/* Panel de Configuración y Auditoría Automática */}
      <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Sanciones Automáticas por Morosidad</h3>
        
        {auditMsg && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: auditMsg.tipo === 'error' ? '#fde8e8' : '#e1fdf4', color: auditMsg.tipo === 'error' ? 'var(--danger-color)' : 'var(--success-color)' }}>
            <strong>{auditMsg.texto}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Meses de Tolerancia</label>
            <input 
              type="number" 
              className="form-input" 
              style={{ width: '120px' }} 
              value={mesesTol} 
              onChange={e => setMesesTol(parseInt(e.target.value))} 
              min={1}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Multa Fija ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              style={{ width: '120px' }} 
              value={montoFij} 
              onChange={e => setMontoFij(parseFloat(e.target.value))} 
              min={0.1}
            />
          </div>
          <div>
            <button className="btn btn-outline" onClick={handleGuardarConfig} disabled={loading}>
              Guardar Regla
            </button>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <button className="btn btn-danger" onClick={handleAuditar} disabled={loading}>
              ⚡ Auditar y Generar Multas
            </button>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Categoría / Motivo</th>
              <th>Monto ($)</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {initialMultas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay multas registradas.</td>
              </tr>
            ) : (
              initialMultas.map(multa => (
                <tr key={multa.id}>
                  <td>{new Date(multa.fecha_generacion).toLocaleDateString()}</td>
                  <td>
                    <strong>{multa.clientes?.nombre} {multa.clientes?.apellido}</strong><br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{multa.clientes?.cedula}</span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{multa.categoria_multa}</span><br/>
                    <span style={{ fontSize: '0.85rem' }}>{multa.motivo}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>
                      ${multa.monto_generado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${multa.estado === 'pagado' ? 'badge-success' : multa.estado === 'pendiente' ? 'badge-danger' : 'badge-warning'}`}>
                      {multa.estado}
                    </span>
                  </td>
                  <td>
                    {multa.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handlePagar(multa.id)}>
                          Pagar
                        </button>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }} onClick={() => handleAnular(multa.id)}>
                          Anular
                        </button>
                      </div>
                    )}
                    {multa.estado === 'pagado' && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>Pagado</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              Registrar Multa Manual
            </h2>

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCrearMulta}>
              <div className="form-group">
                <label className="form-label">Cliente Infractor</label>
                <select 
                  className="form-control" 
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  required
                >
                  <option value="" disabled>Seleccione un cliente...</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>
                      {cli.nombre} {cli.apellido} - {cli.cedula}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-control" 
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                  >
                    <option value="minga">Falta a Minga</option>
                    <option value="sesion">Falta a Sesión/Asamblea</option>
                    <option value="daño">Daño a Bienes</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monto de la Multa ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    className="form-control" 
                    value={monto}
                    onChange={(e) => setMonto(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required 
                    placeholder="Ej. 10.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo detallado</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required 
                  placeholder="Escriba la razón de la multa..." 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-danger" disabled={loading || clienteId === '' || monto === ''}>
                  {loading ? 'Guardando...' : 'Aplicar Multa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
