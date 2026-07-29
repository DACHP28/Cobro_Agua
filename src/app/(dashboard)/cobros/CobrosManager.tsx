'use client'

import { useState } from 'react';
import { Cobro, Consumo, Multa, Tarifa } from '@/types/database.types';
import { generarCobro, registrarPago, registrarPagoMultiple } from './actions';
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
  const [activeTab, setActiveTab] = useState<'clientes_deuda' | 'estado_cuenta' | 'generar'>('clientes_deuda');
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para Pagos de un solo ítem (Legacy / Historial)
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<DeudaUnificada | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para Generar Factura de Agua desde Consumos
  const [generando, setGenerando] = useState<number | null>(null);

  // ESTADOS NUEVOS: Taquilla de Cobro Agrupado por Cliente con Checkboxes
  const [clienteCobroModal, setClienteCobroModal] = useState<{
    cliente_id: number;
    cliente_nombre: string;
    cliente_cedula: string;
    serviciosPendientes: DeudaUnificada[];
    multasPendientes: DeudaUnificada[];
    totalDeuda: number;
  } | null>(null);

  const [selectedServicios, setSelectedServicios] = useState<number[]>([]);
  const [selectedMultas, setSelectedMultas] = useState<number[]>([]);
  const [metodoPagoGrupal, setMetodoPagoGrupal] = useState('efectivo');
  const [referenciaGrupal, setReferenciaGrupal] = useState('');

  // Estado para la Pantalla de Éxito y Recibos Separados
  const [pagoExitosoData, setPagoExitosoData] = useState<{
    serviciosIds: number[];
    multasIds: number[];
    totalPagado: number;
    clienteNombre: string;
  } | null>(null);

  // Unificar Deudas para Historial Desglosado
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

  // AGRUPAR DEUDAS PENDIENTES POR CLIENTE PARA VENTANILLA
  const clientesAgrupadosMap = new Map<number, {
    cliente_id: number;
    cliente_nombre: string;
    cliente_cedula: string;
    serviciosPendientes: DeudaUnificada[];
    multasPendientes: DeudaUnificada[];
    totalDeuda: number;
  }>();

  deudas.forEach(deuda => {
    if (deuda.estado !== 'pendiente') return; // Solo pendientes de pago
    if (!clientesAgrupadosMap.has(deuda.cliente_id)) {
      clientesAgrupadosMap.set(deuda.cliente_id, {
        cliente_id: deuda.cliente_id,
        cliente_nombre: deuda.cliente_nombre,
        cliente_cedula: deuda.cliente_cedula,
        serviciosPendientes: [],
        multasPendientes: [],
        totalDeuda: 0
      });
    }
    const grp = clientesAgrupadosMap.get(deuda.cliente_id)!;
    if (deuda.tipo === 'servicio') {
      grp.serviciosPendientes.push(deuda);
    } else {
      grp.multasPendientes.push(deuda);
    }
    grp.totalDeuda = Number((grp.totalDeuda + Number(deuda.monto)).toFixed(2));
  });

  const listaClientesMorosos = Array.from(clientesAgrupadosMap.values()).filter(c => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase().trim();
    return c.cliente_nombre.toLowerCase().includes(q) || c.cliente_cedula.toLowerCase().includes(q);
  });

  // Handlers
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
    setActiveTab('clientes_deuda');
  };

  const abrirModalCobroGrupo = (grupo: any) => {
    setClienteCobroModal(grupo);
    // Seleccionar por defecto todo lo pendiente
    setSelectedServicios(grupo.serviciosPendientes.map((s: any) => s.id_original));
    setSelectedMultas(grupo.multasPendientes.map((m: any) => m.id_original));
    setPagoExitosoData(null);
    setMetodoPagoGrupal('efectivo');
    setReferenciaGrupal('');
  };

  const toggleServicio = (id: number) => {
    setSelectedServicios(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleMulta = (id: number) => {
    setSelectedMultas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalSeleccionado = (clienteCobroModal ? [
    ...clienteCobroModal.serviciosPendientes.filter(s => selectedServicios.includes(s.id_original)).map(s => Number(s.monto)),
    ...clienteCobroModal.multasPendientes.filter(m => selectedMultas.includes(m.id_original)).map(m => Number(m.monto))
  ].reduce((a, b) => a + b, 0) : 0);

  const handleConfirmarPagoGrupal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteCobroModal || (selectedServicios.length === 0 && selectedMultas.length === 0)) return;
    setLoading(true);

    await registrarPagoMultiple(selectedServicios, selectedMultas, metodoPagoGrupal, referenciaGrupal);

    setLoading(false);
    // Configurar pantalla de recibos separados
    setPagoExitosoData({
      serviciosIds: [...selectedServicios],
      multasIds: [...selectedMultas],
      totalPagado: Number(totalSeleccionado.toFixed(2)),
      clienteNombre: clienteCobroModal.cliente_nombre
    });
    setClienteCobroModal(null);
  };

  // Handlers para pago individual en historial
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
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Ventanilla Única de Cobros</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Recaudación múltiple por cliente, emisión de facturas y comprobantes independientes por agua y multas.</p>
        </div>
      </div>

      {/* Tabs Principales */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('clientes_deuda')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.02rem', cursor: 'pointer', padding: '0.6rem 1.2rem',
            fontWeight: activeTab === 'clientes_deuda' ? '800' : '500',
            color: activeTab === 'clientes_deuda' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'clientes_deuda' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
          }}
        >
          🏛️ Cobro por Cliente ({listaClientesMorosos.length})
        </button>
        <button 
          onClick={() => setActiveTab('generar')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.02rem', cursor: 'pointer', padding: '0.6rem 1.2rem',
            fontWeight: activeTab === 'generar' ? '800' : '500',
            color: activeTab === 'generar' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'generar' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
          }}
        >
          📋 Generar Cobros por Agua ({consumosPendientes.length})
        </button>
        <button 
          onClick={() => setActiveTab('estado_cuenta')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.02rem', cursor: 'pointer', padding: '0.6rem 1.2rem',
            fontWeight: activeTab === 'estado_cuenta' ? '800' : '500',
            color: activeTab === 'estado_cuenta' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'estado_cuenta' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap'
          }}
        >
          📜 Historial y Desglose Completo ({deudas.length})
        </button>
      </div>

      {/* VISTA 1: TAQUILLA DE COBRO POR CLIENTE (NUEVA VENTAJA PRINCIPAL) */}
      {activeTab === 'clientes_deuda' && (
        <>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar cliente por nombres o cédula/RUC..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1.2rem 0.75rem 2.5rem', borderRadius: '30px',
                  border: '1px solid var(--border-color)', fontSize: '0.95rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)', outline: 'none'
                }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                👤
              </span>
            </div>
            {busqueda && (
              <button className="btn btn-outline" onClick={() => setBusqueda('')} style={{ borderRadius: '30px', padding: '0 1.2rem' }}>
                Limpiar
              </button>
            )}
          </div>

          <div className="table-container" style={{ boxShadow: '0 4px 10px -1px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th>Cliente Propietario</th>
                  <th>Cédula / RUC</th>
                  <th>Facturas de Agua (Meses)</th>
                  <th>Multas por Atraso</th>
                  <th>Deuda Total Acumulada</th>
                  <th>Ventanilla</th>
                </tr>
              </thead>
              <tbody>
                {listaClientesMorosos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✨</div>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'block' }}>Sin Deudas Pendientes</strong>
                      <span style={{ fontSize: '0.95rem' }}>No hay clientes morosos con el criterio de búsqueda actual. Todo está al día.</span>
                    </td>
                  </tr>
                ) : (
                  listaClientesMorosos.map((grp) => (
                    <tr key={grp.cliente_id} style={{ transition: 'background-color 0.2s', cursor: 'pointer' }} onClick={() => abrirModalCobroGrupo(grp)}>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--primary-color)' }}>{grp.cliente_nombre}</strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{grp.cliente_cedula || 'Sin Cédula'}</span>
                      </td>
                      <td>
                        {grp.serviciosPendientes.length > 0 ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}>
                            💧 {grp.serviciosPendientes.length} mes(es) pendientes (${grp.serviciosPendientes.reduce((a,b)=>a+Number(b.monto),0).toFixed(2)})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success-color)', fontSize: '0.85rem' }}>✓ Agua Al día</span>
                        )}
                      </td>
                      <td>
                        {grp.multasPendientes.length > 0 ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem', backgroundColor: 'var(--danger-color)', color: 'white' }}>
                            🚨 {grp.multasPendientes.length} sanción(es) (${grp.multasPendientes.reduce((a,b)=>a+Number(b.monto),0).toFixed(2)})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>— Sin multas</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger-color)' }}>
                          ${grp.totalDeuda.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderRadius: '30px', fontWeight: 700, boxShadow: '0 2px 5px rgba(79, 70, 229, 0.3)' }}
                          onClick={(e) => { e.stopPropagation(); abrirModalCobroGrupo(grp); }}
                        >
                          💸 Cobrar a Cliente...
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VISTA 2: Generar Cobros */}
      {activeTab === 'generar' && (
        <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
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
                    <span style={{ fontSize: '0.9rem' }}>Todas las lecturas de medidor recibidas ya han sido convertidas en facturas de cobro.</span>
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

      {/* VISTA 3: Estado de Cuenta Individual / Historial Desglosado */}
      {activeTab === 'estado_cuenta' && (
        <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
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
                    <span style={{ fontSize: '0.9rem' }}>No hay cuentas pendientes ni multas en este momento.</span>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--success-color)' }}>
                            Pagado: {new Date(deuda.fecha_pago || '').toLocaleDateString()}
                          </span>
                          <a 
                            href={`/comprobante/${deuda.tipo === 'servicio' ? 'agua' : 'multa'}/${deuda.id_original}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-outline" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            🖨️ Imprimir Recibo
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

      {/* MODAL NUEVO: PAGO GRUPAL Y SELECCIONABLE CON CHECKBOXES POR CLIENTE */}
      {clienteCobroModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.4rem' }}>🛒 Ventanilla de Pago</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Cliente: <strong style={{ color: 'var(--text-primary)' }}>{clienteCobroModal.cliente_nombre}</strong> ({clienteCobroModal.cliente_cedula || 'C.I. no registrada'})
                </span>
              </div>
              <button className="btn btn-outline" onClick={() => setClienteCobroModal(null)} style={{ padding: '0.3rem 0.7rem', fontSize: '1.2rem' }}>×</button>
            </div>

            <form onSubmit={handleConfirmarPagoGrupal}>
              {/* SECCIÓN 1: SERVICIOS DE AGUA */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', backgroundColor: '#eff6ff', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <strong style={{ color: '#1d4ed8', fontSize: '1rem' }}>💧 Facturas de Agua Potable ({clienteCobroModal.serviciosPendientes.length})</strong>
                  {clienteCobroModal.serviciosPendientes.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const allIds = clienteCobroModal.serviciosPendientes.map(s => s.id_original);
                        const allSelected = allIds.every(id => selectedServicios.includes(id));
                        setSelectedServicios(allSelected ? [] : allIds);
                      }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      {clienteCobroModal.serviciosPendientes.every(s => selectedServicios.includes(s.id_original)) ? 'Deseleccionar todo' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>

                {clienteCobroModal.serviciosPendientes.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 1rem' }}>No hay meses de agua en mora para este cliente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto', padding: '0.2rem' }}>
                    {clienteCobroModal.serviciosPendientes.map(srv => {
                      const isChecked = selectedServicios.includes(srv.id_original);
                      return (
                        <label 
                          key={`srv-${srv.id_original}`}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '0.75rem 1rem', borderRadius: '8px', border: `2px solid ${isChecked ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            backgroundColor: isChecked ? '#f8fafc' : 'white', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleServicio(srv.id_original)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                            />
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{srv.concepto}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Emisión: {new Date(srv.fecha).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-color)' }}>
                            ${srv.monto}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: MULTAS Y SANCIoNES */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', backgroundColor: '#fef2f2', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #fecca2' }}>
                  <strong style={{ color: '#b91c1c', fontSize: '1rem' }}>🚨 Multas por Atraso o Infracción ({clienteCobroModal.multasPendientes.length})</strong>
                  {clienteCobroModal.multasPendientes.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const allIds = clienteCobroModal.multasPendientes.map(m => m.id_original);
                        const allSelected = allIds.every(id => selectedMultas.includes(id));
                        setSelectedMultas(allSelected ? [] : allIds);
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      {clienteCobroModal.multasPendientes.every(m => selectedMultas.includes(m.id_original)) ? 'Deseleccionar todo' : 'Seleccionar todas'}
                    </button>
                  )}
                </div>

                {clienteCobroModal.multasPendientes.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 1rem' }}>Sin multas pendientes registradas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto', padding: '0.2rem' }}>
                    {clienteCobroModal.multasPendientes.map(mul => {
                      const isChecked = selectedMultas.includes(mul.id_original);
                      return (
                        <label 
                          key={`mul-${mul.id_original}`}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '0.75rem 1rem', borderRadius: '8px', border: `2px solid ${isChecked ? 'var(--danger-color)' : 'var(--border-color)'}`,
                            backgroundColor: isChecked ? '#fff5f5' : 'white', cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleMulta(mul.id_original)}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--danger-color)', cursor: 'pointer' }}
                            />
                            <div>
                              <strong style={{ display: 'block', color: '#991b1b', fontSize: '0.92rem' }}>{mul.concepto}</strong>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Fecha: {new Date(mul.fecha).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--danger-color)' }}>
                            ${mul.monto}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RESUMEN DE TAQUILLA Y MÉTODO DE PAGO */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>Total Seleccionado hoy:</span>
                    <strong style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>${totalSeleccionado.toFixed(2)}</strong>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Agua seleccionada: <strong>{selectedServicios.length} mes(es)</strong></div>
                    <div>Multas seleccionadas: <strong>{selectedMultas.length} sanción(es)</strong></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Método de Pago</label>
                    <select value={metodoPagoGrupal} onChange={(e) => setMetodoPagoGrupal(e.target.value)} className="form-control" required>
                      <option value="efectivo">💵 Efectivo (Taquilla)</option>
                      <option value="transferencia">🏦 Transferencia Bancaria</option>
                      <option value="tarjeta">💳 Tarjeta de Crédito/Débito</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Nº Referencia / Voucher (Opcional)</label>
                    <input 
                      type="text" 
                      value={referenciaGrupal} 
                      onChange={(e) => setReferenciaGrupal(e.target.value)} 
                      className="form-control" 
                      placeholder="Ej. TRANS-884930" 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setClienteCobroModal(null)} disabled={loading}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || (selectedServicios.length === 0 && selectedMultas.length === 0)}
                  style={{ padding: '0.75rem 1.8rem', fontWeight: 800, fontSize: '1.05rem', borderRadius: '30px', boxShadow: '0 3px 8px rgba(79, 70, 229, 0.35)' }}
                >
                  {loading ? 'Procesando Pago...' : `✔️ Procesar y Recaudar ($${totalSeleccionado.toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PANTALLA DE ÉXITO Tras Cobro Grupal con RECIBOS SEPARADOS */}
      {pagoExitosoData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉</div>
            <h2 style={{ color: 'var(--success-color)', margin: '0 0 0.5rem 0', fontSize: '1.6rem', fontWeight: 800 }}>
              ¡Cobro Recaudado Exitosamente!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Transacción confirmada en taquilla por <strong>${pagoExitosoData.totalPagado.toFixed(2)}</strong> a cuenta de <strong>{pagoExitosoData.clienteNombre}</strong>.
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '2rem', textAlign: 'left' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🖨️ Comprobantes Oficiales Separados
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {pagoExitosoData.serviciosIds.length > 0 && (
                  <a 
                    href={`/comprobante/agua/${pagoExitosoData.serviciosIds.join(',')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', borderRadius: '10px' }}
                  >
                    💧 Imprimir Recibo de Servicio de Agua ({pagoExitosoData.serviciosIds.length} mes{pagoExitosoData.serviciosIds.length > 1 ? 'es' : ''})
                  </a>
                )}

                {pagoExitosoData.multasIds.length > 0 && (
                  <a 
                    href={`/comprobante/multa/${pagoExitosoData.multasIds.join(',')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-danger"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.85rem', fontWeight: 700, fontSize: '0.95rem', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '10px' }}
                  >
                    🚨 Imprimir Recibo de Multas ({pagoExitosoData.multasIds.length} sanción{pagoExitosoData.multasIds.length > 1 ? 'es' : ''})
                  </a>
                )}
              </div>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic', textAlign: 'center' }}>
                * Los recibos de servicio y multas se emiten en documentos independientes para garantizar la separación fiscal y contable.
              </span>
            </div>

            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ width: '100%', padding: '0.8rem', fontWeight: 700, borderRadius: '30px' }}
              onClick={() => setPagoExitosoData(null)}
            >
              ← Concluir y Volver a Taquilla
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO ÚNICO (Historial Legacy) */}
      {showPagoModal && deudaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              Registrar Cobro Individual
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

