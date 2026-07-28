'use client'

import { useState } from 'react';
import { Cobro, Consumo, Multa, Tarifa } from '@/types/database.types';
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
  initialMultas,
  initialTarifas = [] 
}: { 
  initialCobros: Cobro[], 
  consumosPendientes: Consumo[],
  initialMultas: Multa[],
  initialTarifas?: Tarifa[] 
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

  const handleGenerarCobro = async (consumo: Consumo, montoTotal?: number, desglose?: string) => {
    const textoConfirm = montoTotal ? `¿Generar factura por $${montoTotal.toFixed(2)} (${desglose}) para el mes de ${consumo.mes_anio}?` : `¿Generar factura para el mes de ${consumo.mes_anio}?`;
    if (!confirm(textoConfirm)) return;
    
    setGenerando(consumo.id);
    // @ts-ignore
    const clienteId = consumo.medidores?.clientes?.id;
    if (clienteId) {
      await generarCobro(consumo.id, clienteId as number, consumo.consumo_calculado, montoTotal);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Centro Único de Pagos</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ventanilla oficial de recaudación, facturación de consumos e impresión de comprobantes.</p>
        </div>
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
        <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>Al día en Cobros y Facturación</strong>
                    <span style={{ fontSize: '0.9rem' }}>No hay cuentas pendientes ni multas morosas en este momento.</span>
                  </td>
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
        <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Cliente / Medidor</th>
                <th>Consumo Calculado</th>
                <th>Tarifa Aplicada (Base + Excedente)</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {consumosPendientes.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>Sin Lecturas Pendientes de Emitir</strong>
                    <span style={{ fontSize: '0.9rem' }}>Todas las lecturas recibidas han sido convertidas en recibos de cobro exitosamente.</span>
                  </td>
                </tr>
              ) : (
                consumosPendientes.map(consumo => {
                  // @ts-ignore
                  const cli = consumo.medidores?.clientes;
                  // @ts-ignore
                  const med = consumo.medidores?.numero;
                  // @ts-ignore
                  const tipoServicio = consumo.medidores?.tipo_servicio || 'RESIDENCIAL';

                  const tarifa = initialTarifas.find(t => t.tipo_medidor.toUpperCase().trim() === String(tipoServicio).toUpperCase().trim());
                  let montoEstimado = Number((consumo.consumo_calculado * 0.50).toFixed(2));
                  let desglose = `${consumo.consumo_calculado} m³ x $0.50 (tarifa básica defecto)`;

                  if (tarifa) {
                    if (consumo.consumo_calculado <= tarifa.unidad_excedente) {
                      montoEstimado = Number(tarifa.tarifa_base);
                      desglose = `Base ${tarifa.tipo_medidor}: incluye hasta ${tarifa.unidad_excedente} m³`;
                    } else {
                      const excedente = consumo.consumo_calculado - tarifa.unidad_excedente;
                      const costoExtra = excedente * Number(tarifa.tarifa_excedente);
                      montoEstimado = Number(Number(tarifa.tarifa_base) + costoExtra);
                      desglose = `Base ($${Number(tarifa.tarifa_base).toFixed(2)}) + ${excedente} m³ extra ($${costoExtra.toFixed(2)})`;
                    }
                  }

                  return (
                    <tr key={consumo.id}>
                      <td><strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{consumo.mes_anio}</strong></td>
                      <td>
                        <strong>{cli?.nombre} {cli?.apellido}</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Medidor: <strong>{med}</strong> (<span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{tipoServicio}</span>)</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{consumo.consumo_calculado} m³</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--success-color)', fontSize: '1.2rem' }}>
                          ${montoEstimado.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem', maxWidth: '240px' }}>
                          {desglose}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderRadius: '30px', fontWeight: 600, boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)' }}
                          onClick={() => handleGenerarCobro(consumo, montoEstimado, desglose)}
                          disabled={generando === consumo.id}
                        >
                          {generando === consumo.id ? 'Facturando...' : 'Generar Factura'}
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
