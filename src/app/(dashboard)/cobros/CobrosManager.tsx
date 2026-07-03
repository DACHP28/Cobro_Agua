'use client'

import { useState } from 'react';
import { Cobro, Consumo, Multa } from '@/types/database.types';
import { generarCobro, registrarPago } from './actions';
import { registrarPagoMulta } from '../multas/actions';

interface DeudaUnificada {
  tipo: 'servicio' | 'multa';
  id_original: number;
  fecha: string;
  cliente_id: number;
  cliente_nombre: string;
  cliente_cedula: string;
  concepto: string;
  monto: number;
  estado: string;
  fecha_pago: string | null;
}

export default function CobrosManager({ 
  initialCobros, 
  consumosPendientes,
  initialMultas 
}: { 
  initialCobros: Cobro[], 
  consumosPendientes: Consumo[],
  initialMultas: Multa[]
}) {
  const [activeTab, setActiveTab] = useState<'estado_cuenta' | 'generar'>('estado_cuenta');
  
  // Estados para Pagos
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<DeudaUnificada | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para Generar Factura
  const [generando, setGenerando] = useState<number | null>(null);

  // Unificar Deudas
  const deudas: DeudaUnificada[] = [
    ...initialCobros.map(c => ({
      tipo: 'servicio' as const,
      id_original: c.id,
      fecha: c.fecha_emision,
      cliente_id: c.cliente_id,
      cliente_nombre: `${c.clientes?.nombre} ${c.clientes?.apellido}`,
      cliente_cedula: c.clientes?.cedula || '',
      concepto: `Consumo de Agua (${c.consumos?.mes_anio}) - ${c.consumos?.consumo_calculado} m³`,
      monto: c.monto_total,
      estado: c.estado,
      fecha_pago: c.fecha_pago
    })),
    ...initialMultas.map(m => ({
      tipo: 'multa' as const,
      id_original: m.id,
      fecha: m.fecha_generacion,
      cliente_id: m.cliente_id,
      cliente_nombre: `${m.clientes?.nombre} ${m.clientes?.apellido}`,
      cliente_cedula: m.clientes?.cedula || '',
      concepto: `Multa: ${m.categoria_multa.toUpperCase()} - ${m.motivo}`,
      monto: m.monto_generado,
      estado: m.estado,
      fecha_pago: m.fecha_pago
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const handleGenerarCobro = async (consumo: Consumo) => {
    if (!confirm(`¿Generar factura por ${consumo.consumo_calculado} m³ para el mes de ${consumo.mes_anio}?`)) return;
    
    setGenerando(consumo.id);
    // @ts-ignore
    const clienteId = consumo.medidores?.clientes?.id;
    if (clienteId) {
      await generarCobro(consumo.id, clienteId as number, consumo.consumo_calculado);
    }
    setGenerando(null);
    setActiveTab('estado_cuenta');
  };

  const abrirModalPago = (deuda: DeudaUnificada) => {
    setDeudaSeleccionada(deuda);
    setShowPagoModal(true);
  };

  const handleRegistrarPago = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!deudaSeleccionada) return;
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const metodo = formData.get('metodo') as string;
    const referencia = formData.get('referencia') as string;

    if (deudaSeleccionada.tipo === 'servicio') {
      await registrarPago(deudaSeleccionada.id_original, metodo, referencia);
    } else {
      // Las multas actualmente no guardan método de pago en BD en esta versión básica, 
      // pero llamamos a la acción de pagarla
      await registrarPagoMulta(deudaSeleccionada.id_original);
    }

    setLoading(false);
    setShowPagoModal(false);
    setDeudaSeleccionada(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Centro Único de Pagos</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('estado_cuenta')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 1rem',
            fontWeight: activeTab === 'estado_cuenta' ? 'bold' : 'normal',
            color: activeTab === 'estado_cuenta' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'estado_cuenta' ? '2px solid var(--primary-color)' : 'none'
          }}
        >
          Estado de Cuenta (Deudas)
        </button>
        <button 
          onClick={() => setActiveTab('generar')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 1rem',
            fontWeight: activeTab === 'generar' ? 'bold' : 'normal',
            color: activeTab === 'generar' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'generar' ? '2px solid var(--primary-color)' : 'none'
          }}
        >
          Generar Cobros por Agua ({consumosPendientes.length})
        </button>
      </div>

      {/* VISTA 1: Estado de Cuenta (Servicios y Multas) */}
      {activeTab === 'estado_cuenta' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha Emisión</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Monto ($)</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {deudas.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay facturas ni multas registradas.</td>
                </tr>
              ) : (
                deudas.map((deuda, idx) => (
                  <tr key={`${deuda.tipo}-${deuda.id_original}-${idx}`}>
                    <td>{new Date(deuda.fecha).toLocaleDateString()}</td>
                    <td>
                      <strong>{deuda.cliente_nombre}</strong><br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{deuda.cliente_cedula}</span>
                    </td>
                    <td>
                      {deuda.tipo === 'multa' ? (
                        <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>[MULTA] </span>
                      ) : (
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>[AGUA] </span>
                      )}
                      {deuda.concepto}
                    </td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                        ${deuda.monto}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${deuda.estado === 'pagado' ? 'badge-success' : deuda.estado === 'pendiente' ? 'badge-danger' : 'badge-warning'}`}>
                        {deuda.estado}
                      </span>
                    </td>
                    <td>
                      {deuda.estado === 'pendiente' && (
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => abrirModalPago(deuda)}>
                          Cobrar
                        </button>
                      )}
                      {deuda.estado === 'pagado' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--success-color)' }}>
                            Pagado el {new Date(deuda.fecha_pago || '').toLocaleDateString()}
                          </span>
                          <a 
                            href={`/comprobante/${deuda.tipo === 'servicio' ? 'agua' : 'multa'}/${deuda.id_original}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            🖨️ Imprimir
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 2: Generar Cobros */}
      {activeTab === 'generar' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Cliente / Medidor</th>
                <th>Consumo Calculado</th>
                <th>Tarifa Fija</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {consumosPendientes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay lecturas pendientes por cobrar.</td>
                </tr>
              ) : (
                consumosPendientes.map(consumo => {
                  // @ts-ignore
                  const cli = consumo.medidores?.clientes;
                  // @ts-ignore
                  const med = consumo.medidores?.numero;
                  const tarifaEstimada = (consumo.consumo_calculado * 0.50).toFixed(2);

                  return (
                    <tr key={consumo.id}>
                      <td><strong>{consumo.mes_anio}</strong></td>
                      <td>
                        {cli?.nombre} {cli?.apellido}<br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Medidor: {med}</span>
                      </td>
                      <td>{consumo.consumo_calculado} m³</td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: 'var(--success-color)' }}>
                          ${tarifaEstimada}
                        </span> <span style={{ fontSize: '0.8rem' }}>(0.50 x m³)</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleGenerarCobro(consumo)}
                          disabled={generando === consumo.id}
                        >
                          {generando === consumo.id ? 'Generando...' : 'Generar Factura'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE PAGO ÚNICO */}
      {showPagoModal && deudaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              Registrar Cobro
            </h2>
            
            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {deudaSeleccionada.concepto}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                ${deudaSeleccionada.monto}
              </div>
            </div>

            <form onSubmit={handleRegistrarPago}>
              <div className="form-group">
                <label className="form-label">Método de Pago</label>
                <select name="metodo" className="form-control" required>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                </select>
              </div>

              {deudaSeleccionada.tipo === 'servicio' && (
                <div className="form-group">
                  <label className="form-label">Número de Referencia / Comprobante (Opcional)</label>
                  <input type="text" name="referencia" className="form-control" placeholder="Ej. REF-44829" />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPagoModal(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
