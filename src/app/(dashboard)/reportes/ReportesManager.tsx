'use client'

import { useState, useEffect } from 'react';
import { getReporteCaja, getReporteMorosos, getReporteConsumos } from './actions';

interface IngresoUnificado {
  id_unico: string;
  id_original: number;
  tipo: 'agua' | 'multa';
  fecha_pago: string;
  cliente_nombre: string;
  cliente_cedula: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
  referencia_pago?: string | null;
}

export default function ReportesManager() {
  const [tipoReporte, setTipoReporte] = useState('caja');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [mesAnio, setMesAnio] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });

  // Filtros Avanzados para Control de Caja y Arqueo
  const [filtroRubro, setFiltroRubro] = useState<'todos' | 'agua' | 'multas'>('todos');
  const [filtroMetodo, setFiltroMetodo] = useState<'todos' | 'efectivo' | 'transferencia' | 'tarjeta'>('todos');
  const [busquedaCaja, setBusquedaCaja] = useState('');

  // Estado para Morosidad
  const [filtroMorosidadTipo, setFiltroMorosidadTipo] = useState<'todos' | 'agua' | 'multas'>('todos');

  const [loading, setLoading] = useState(false);
  const [datosCaja, setDatosCaja] = useState<any>(null);
  const [datosMorosos, setDatosMorosos] = useState<any>(null);
  const [datosConsumos, setDatosConsumos] = useState<any>(null);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      if (tipoReporte === 'caja') {
        const data = await getReporteCaja(fechaInicio, fechaFin);
        setDatosCaja(data);
      } else if (tipoReporte === 'morosos') {
        const data = await getReporteMorosos();
        setDatosMorosos(data);
      } else if (tipoReporte === 'consumos') {
        const data = await getReporteConsumos(mesAnio);
        setDatosConsumos(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarReporte();
  }, [tipoReporte, fechaInicio, fechaFin, mesAnio]);

  // Funciones Rápidas para Rangos de Fecha (Cortes Diarios / Mes)
  const aplicarRangoRapido = (tipo: 'hoy' | 'semana' | 'mes' | 'anio') => {
    const hoy = new Date();
    const strHoy = hoy.toISOString().split('T')[0];
    setFechaFin(strHoy);

    if (tipo === 'hoy') {
      setFechaInicio(strHoy);
    } else if (tipo === 'semana') {
      const hace7Dias = new Date();
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      setFechaInicio(hace7Dias.toISOString().split('T')[0]);
    } else if (tipo === 'mes') {
      const primeroMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicio(primeroMes.toISOString().split('T')[0]);
    } else if (tipo === 'anio') {
      const primeroAnio = new Date(hoy.getFullYear(), 0, 1);
      setFechaInicio(primeroAnio.toISOString().split('T')[0]);
    }
  };

  // Procesamiento de Datos de Caja (Ingresos Unificados)
  const obtenerIngresosUnificados = (): IngresoUnificado[] => {
    if (!datosCaja) return [];
    const lista: IngresoUnificado[] = [];

    // Agua
    datosCaja.ingresosAgua?.forEach((i: any) => {
      lista.push({
        id_unico: `agua-${i.id}`,
        id_original: i.id,
        tipo: 'agua',
        fecha_pago: i.fecha_pago || i.fecha_emision,
        cliente_nombre: `${i.clientes?.nombre || ''} ${i.clientes?.apellido || ''}`.trim() || 'Cliente Desconocido',
        cliente_cedula: i.clientes?.cedula || 'N/D',
        concepto: `Servicio Agua (${i.consumos?.mes_anio || 'Periodo'}) - ${i.consumos?.consumo_calculado || 0} m³`,
        monto: Number(i.monto_total || 0),
        metodo_pago: (i.metodo_pago || 'efectivo').toLowerCase(),
        referencia_pago: i.referencia_pago
      });
    });

    // Multas
    datosCaja.ingresosMultas?.forEach((m: any) => {
      lista.push({
        id_unico: `multa-${m.id}`,
        id_original: m.id,
        tipo: 'multa',
        fecha_pago: m.fecha_pago || m.fecha_generacion,
        cliente_nombre: `${m.clientes?.nombre || ''} ${m.clientes?.apellido || ''}`.trim() || 'Cliente Desconocido',
        cliente_cedula: m.clientes?.cedula || 'N/D',
        concepto: `Multa: ${(m.categoria_multa || '').toUpperCase()} - ${m.motivo || ''}`,
        monto: Number(m.monto_generado || 0),
        metodo_pago: (m.metodo_pago || 'efectivo').toLowerCase(),
        referencia_pago: (m as any).referencia_pago || null
      });
    });

    // Ordenar por fecha de pago descendente
    return lista.sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
  };

  const ingresosUnificados = obtenerIngresosUnificados();

  const ingresosFiltrados = ingresosUnificados.filter(item => {
    if (filtroRubro === 'agua' && item.tipo !== 'agua') return false;
    if (filtroRubro === 'multas' && item.tipo !== 'multa') return false;

    if (filtroMetodo !== 'todos') {
      if (item.metodo_pago !== filtroMetodo) return false;
    }

    if (busquedaCaja.trim()) {
      const q = busquedaCaja.toLowerCase().trim();
      const matchNombre = item.cliente_nombre.toLowerCase().includes(q);
      const matchCedula = item.cliente_cedula.toLowerCase().includes(q);
      const matchRef = (item.referencia_pago || '').toLowerCase().includes(q);
      const matchConcepto = item.concepto.toLowerCase().includes(q);
      return matchNombre || matchCedula || matchRef || matchConcepto;
    }

    return true;
  });

  // Cálculos para KPIs del Arqueo de Caja
  const totalRecaudadoFiltrado = ingresosFiltrados.reduce((acc, val) => acc + val.monto, 0);
  const totalEgresos = datosCaja?.egresos?.reduce((acc: number, val: any) => acc + Number(val.monto || 0), 0) || 0;
  
  // Desglose de Todos los ingresos del periodo
  const recaudoEfectivo = ingresosUnificados.filter(x => x.metodo_pago === 'efectivo').reduce((a, b) => a + b.monto, 0);
  const recaudoTransferencia = ingresosUnificados.filter(x => x.metodo_pago === 'transferencia').reduce((a, b) => a + b.monto, 0);
  const recaudoTarjeta = ingresosUnificados.filter(x => x.metodo_pago === 'tarjeta').reduce((a, b) => a + b.monto, 0);
  const recaudoAguaTotal = ingresosUnificados.filter(x => x.tipo === 'agua').reduce((a, b) => a + b.monto, 0);
  const recaudoMultasTotal = ingresosUnificados.filter(x => x.tipo === 'multa').reduce((a, b) => a + b.monto, 0);

  return (
    <div className="card" style={{ padding: '2rem', backgroundColor: '#ffffff', minHeight: '85vh', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      {/* Cabecera Superior */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', color: 'var(--primary-color)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            📊 Centro de Auditoría y Reportes de Caja
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Control contable exhaustivo del flujo de efectivo, transferencias, morosidad y consumos por medidor.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => window.print()}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
        >
          🖨️ Imprimir / Exportar Arqueo Oficial
        </button>
      </div>

      {/* Selector de Módulo Principal (Pestañas) */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setTipoReporte('caja')}
          style={{
            background: 'none', border: 'none', padding: '0.8rem 1.5rem', fontSize: '1.05rem', cursor: 'pointer',
            fontWeight: tipoReporte === 'caja' ? '800' : '500',
            color: tipoReporte === 'caja' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: tipoReporte === 'caja' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          💰 Arqueo y Control de Caja
        </button>
        <button
          onClick={() => setTipoReporte('morosos')}
          style={{
            background: 'none', border: 'none', padding: '0.8rem 1.5rem', fontSize: '1.05rem', cursor: 'pointer',
            fontWeight: tipoReporte === 'morosos' ? '800' : '500',
            color: tipoReporte === 'morosos' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: tipoReporte === 'morosos' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          ⚠️ Reporte de Morosidad (Deudas)
        </button>
        <button
          onClick={() => setTipoReporte('consumos')}
          style={{
            background: 'none', border: 'none', padding: '0.8rem 1.5rem', fontSize: '1.05rem', cursor: 'pointer',
            fontWeight: tipoReporte === 'consumos' ? '800' : '500',
            color: tipoReporte === 'consumos' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: tipoReporte === 'consumos' ? '3px solid var(--primary-color)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          💧 Reporte de Consumos (m³)
        </button>
      </div>

      {/* CONTROLES Y FILTROS SEGÚN EL REPORTE */}
      <div className="no-print" style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
        {tipoReporte === 'caja' && (
          <div>
            {/* Fila 1: Fechas y Botones Rápidos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.2rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1.2rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha Desde</label>
                <input type="date" className="form-input" style={{ padding: '0.5rem 0.8rem', borderRadius: '8px' }} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Fecha Hasta</label>
                <input type="date" className="form-input" style={{ padding: '0.5rem 0.8rem', borderRadius: '8px' }} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.2rem' }}>⚡ Cortes automáticos:</span>
                <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', borderRadius: '20px' }} onClick={() => aplicarRangoRapido('hoy')}>
                  📅 Hoy (Corte Diario)
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', borderRadius: '20px' }} onClick={() => aplicarRangoRapido('semana')}>
                  📆 Esta Semana
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', borderRadius: '20px' }} onClick={() => aplicarRangoRapido('mes')}>
                  🗓️ Este Mes
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', borderRadius: '20px' }} onClick={() => aplicarRangoRapido('anio')}>
                  📊 Año Actual
                </button>
              </div>
            </div>

            {/* Fila 2: Filtros de Caja (Rubro, Método, Buscador) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>🎯 Rubro de Recaudación</label>
                <select className="form-input" style={{ padding: '0.5rem 1rem', borderRadius: '8px', minWidth: '180px' }} value={filtroRubro} onChange={(e: any) => setFiltroRubro(e.target.value)}>
                  <option value="todos">All: Agua + Multas</option>
                  <option value="agua">💧 Solo Servicios de Agua</option>
                  <option value="multas">🚨 Solo Multas y Sanciones</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>💳 Método de Pago (Caja)</label>
                <select className="form-input" style={{ padding: '0.5rem 1rem', borderRadius: '8px', minWidth: '200px' }} value={filtroMetodo} onChange={(e: any) => setFiltroMetodo(e.target.value)}>
                  <option value="todos">Todos los métodos de pago</option>
                  <option value="efectivo">💵 Solo Efectivo (Dinero Físico)</option>
                  <option value="transferencia">🏦 Solo Transferencia Bancaria</option>
                  <option value="tarjeta">💳 Solo Tarjeta Débito / Crédito</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>🔍 Buscar en este corte</label>
                <input
                  type="text"
                  placeholder="Cliente, cédula o Nº voucher..."
                  className="form-input"
                  style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '8px' }}
                  value={busquedaCaja}
                  onChange={(e) => setBusquedaCaja(e.target.value)}
                />
              </div>
              <div style={{ alignSelf: 'flex-end', marginTop: '1.4rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px' }} onClick={cargarReporte} disabled={loading}>
                  {loading ? '🔄 Cargando...' : '🔄 Actualizar Vista'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tipoReporte === 'morosos' && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Filtro de Morosidad</label>
              <select className="form-input" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', minWidth: '250px' }} value={filtroMorosidadTipo} onChange={(e: any) => setFiltroMorosidadTipo(e.target.value)}>
                <option value="todos">⚠️ Todos los Morosos (Agua y Multas)</option>
                <option value="agua">💧 Deudas de Agua Potable</option>
                <option value="multas">🚨 Multas Pendientes de Pago</option>
              </select>
            </div>
            <button className="btn btn-outline" style={{ alignSelf: 'flex-end', marginTop: '1.4rem', borderRadius: '8px' }} onClick={cargarReporte} disabled={loading}>
              🔄 Actualizar Listado
            </button>
          </div>
        )}

        {tipoReporte === 'consumos' && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Mes y Año (MM-YYYY)</label>
              <input type="text" className="form-input" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', maxWidth: '180px' }} placeholder="07-2026" value={mesAnio} onChange={(e) => setMesAnio(e.target.value)} />
            </div>
            <button className="btn btn-outline" style={{ alignSelf: 'flex-end', marginTop: '1.4rem', borderRadius: '8px' }} onClick={cargarReporte} disabled={loading}>
              🔄 Consultar Consumos
            </button>
          </div>
        )}
      </div>

      {/* ÁREA OFICIAL DE IMPRESIÓN Y DASHBOARD */}
      <div id="print-area">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .no-print, .sidebar, header, .nav-item { display: none !important; }
            .main-content { margin: 0 !important; padding: 0 !important; }
            .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
            body { background: white !important; font-size: 12px; }
            .print-only { display: block !important; }
            .table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
          }
          .print-only { display: none; }
        `}} />

        {/* MEMBRETE PARA IMPRESIÓN OFICIAL */}
        <div className="print-only" style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>JUNTA ADMINISTRADORA DE AGUA POTABLE Y SANEAMIENTO</h2>
          <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', textTransform: 'uppercase' }}>
            {tipoReporte === 'caja' && 'REPORTE OFICIAL DE ARQUEO Y CONTROL DE CAJA'}
            {tipoReporte === 'morosos' && 'REPORTE GENERAL DE CARTERA VENCIDA Y MOROSIDAD'}
            {tipoReporte === 'consumos' && `REPORTE MENSUAL DE CONSUMO DE AGUA (${mesAnio})`}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>
            {tipoReporte === 'caja' && `Corte de Recaudo: Desde ${fechaInicio} hasta ${fechaFin} | Fecha de emisión: ${new Date().toLocaleString()}`}
            {tipoReporte !== 'caja' && `Fecha de emisión: ${new Date().toLocaleString()} | Usuario responsable: Administración`}
          </p>
        </div>

        {/* VISTA 1: REPORTE DE CAJA (CONTROL EXHAUSTIVO) */}
        {tipoReporte === 'caja' && datosCaja && (
          <div>
            {/* TARJETAS KPI DE ARQUEO (DASHBOARD) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.9rem' }}>💵 EN EFECTIVO (CAJA FÍSICA)</span>
                  <span style={{ fontSize: '1.5rem' }}>💰</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#166534', margin: '0.5rem 0' }}>
                  ${recaudoEfectivo.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#15803d' }}>Dinero que debe haber físicamente en cajón</span>
              </div>

              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: '0.9rem' }}>🏦 BANCO / DIGITAL</span>
                  <span style={{ fontSize: '1.5rem' }}>💳</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e40af', margin: '0.5rem 0' }}>
                  ${(recaudoTransferencia + recaudoTarjeta).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#1d4ed8' }}>Transferencias (${recaudoTransferencia.toFixed(2)}) | Tarjetas (${recaudoTarjeta.toFixed(2)})</span>
              </div>

              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#b45309', fontWeight: 700, fontSize: '0.9rem' }}>💧 DESGLOSE DE RUBROS</span>
                  <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#92400e', margin: '0.5rem 0' }}>
                  Agua: ${recaudoAguaTotal.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>Multas cobradas: ${recaudoMultasTotal.toFixed(2)}</span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 700, fontSize: '0.9rem' }}>📉 SALDO NETO PERIODO</span>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: (recaudoEfectivo + recaudoTransferencia + recaudoTarjeta - totalEgresos) >= 0 ? '#16a34a' : '#dc2626', margin: '0.5rem 0' }}>
                  ${(recaudoEfectivo + recaudoTransferencia + recaudoTarjeta - totalEgresos).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Egresos / Gastos Operativos: -${totalEgresos.toFixed(2)}</span>
              </div>
            </div>

            {/* TABLA DE INGRESOS (RECAUDACIÓN DETALLADA) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--success-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                  📈 Detalle de Ingresos Recaudados ({ingresosFiltrados.length} transacciones)
                </h3>
                <span className="badge badge-success" style={{ fontWeight: 700, fontSize: '1rem', padding: '0.4rem 1rem' }}>
                  Total en Vista: ${totalRecaudadoFiltrado.toFixed(2)}
                </span>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <table className="table">
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th>Fecha Pago</th>
                      <th>Cliente Propietario</th>
                      <th>Cédula / RUC</th>
                      <th>Concepto & Período</th>
                      <th>Método de Pago</th>
                      <th>Referencia / Voucher</th>
                      <th style={{ textAlign: 'right' }}>Monto Recaudado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📥</div>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>Sin transacciones con estos filtros</strong>
                          <span>Prueba modificando las fechas, rubros o métodos de pago en la parte superior.</span>
                        </td>
                      </tr>
                    ) : (
                      ingresosFiltrados.map((item) => (
                        <tr key={item.id_unico}>
                          <td>{new Date(item.fecha_pago).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{item.cliente_nombre}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{item.cliente_cedula}</td>
                          <td>
                            {item.tipo === 'multa' ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.75rem', marginRight: '0.4rem', backgroundColor: '#fee2e2', color: '#991b1b' }}>MULTA</span>
                            ) : (
                              <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginRight: '0.4rem', backgroundColor: '#e0e7ff', color: '#3730a3' }}>AGUA</span>
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.concepto}</span>
                          </td>
                          <td>
                            {item.metodo_pago === 'efectivo' && <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 700 }}>💵 Efectivo</span>}
                            {item.metodo_pago === 'transferencia' && <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>🏦 Transferencia</span>}
                            {item.metodo_pago === 'tarjeta' && <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: 700 }}>💳 Tarjeta</span>}
                            {item.metodo_pago !== 'efectivo' && item.metodo_pago !== 'transferencia' && item.metodo_pago !== 'tarjeta' && <span className="badge">{item.metodo_pago.toUpperCase()}</span>}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
                            {item.referencia_pago || '— (Efectivo / Taquilla)'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success-color)', fontSize: '1.1rem' }}>
                            + ${item.monto.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                      <td colSpan={6} style={{ textAlign: 'right', fontSize: '1.05rem', paddingRight: '1rem' }}>SUBTOTAL RECAUDADO EN TABLA:</td>
                      <td style={{ textAlign: 'right', fontSize: '1.25rem', color: 'var(--success-color)' }}>
                        ${totalRecaudadoFiltrado.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABLA DE EGRESOS (GASTOS Y RETIROS) */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--danger-color)', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                  📉 Detalle de Egresos y Gastos Operativos ({datosCaja.egresos?.length || 0} movimientos)
                </h3>
                <span className="badge badge-danger" style={{ fontWeight: 700, fontSize: '1rem', padding: '0.4rem 1rem', backgroundColor: 'var(--danger-color)', color: 'white' }}>
                  Total Egresos: -${totalEgresos.toFixed(2)}
                </span>
              </div>

              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="table">
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th>Fecha Egreso</th>
                      <th>Descripción / Detalle del Gasto</th>
                      <th>Responsable / Categoría</th>
                      <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!datosCaja.egresos || datosCaja.egresos.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 600 }}>No se han registrado egresos ni gastos en este periodo.</span>
                        </td>
                      </tr>
                    ) : (
                      datosCaja.egresos.map((e: any) => (
                        <tr key={'egreso-'+e.id}>
                          <td>{new Date(e.fecha_egreso).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600 }}>{e.descripcion}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{(e as any).categoria || 'Gasto Operativo'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger-color)', fontSize: '1.05rem' }}>
                            - ${Number(e.monto || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CUADRO DE FIRMAS PARA AUDITORÍA CONTABLE (AL IMPRIMIR) */}
            <div className="print-only" style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center', pageBreakInside: 'avoid' }}>
              <div style={{ width: '40%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <strong style={{ display: 'block' }}>RESPONSABLE DE CAJA / RECAUDACIÓN</strong>
                <span style={{ fontSize: '0.8rem' }}>Firma y Sello de Taquilla</span>
              </div>
              <div style={{ width: '40%', borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                <strong style={{ display: 'block' }}>TESORERÍA / PRESIDENCIA</strong>
                <span style={{ fontSize: '0.8rem' }}>Revisión y Aprobación de Arqueo</span>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 2: REPORTE DE MOROSIDAD (CARTERA VENCIDA) */}
        {tipoReporte === 'morosos' && datosMorosos && (
          <div>
            {(() => {
              const cobrosMora = filtroMorosidadTipo === 'multas' ? [] : datosMorosos.cobros || [];
              const multasMora = filtroMorosidadTipo === 'agua' ? [] : datosMorosos.multas || [];
              const totalMoraAgua = cobrosMora.reduce((a: number, b: any) => a + Number(b.monto_total || 0), 0);
              const totalMoraMultas = multasMora.reduce((a: number, b: any) => a + Number(b.monto_generado || 0), 0);
              const granTotalMora = totalMoraAgua + totalMoraMultas;

              return (
                <>
                  {/* Tarjetas de Morosidad */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#991b1b', fontWeight: 700, fontSize: '0.9rem' }}>🚨 CARTERA VENCIDA TOTAL</span>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', margin: '0.5rem 0' }}>
                        ${granTotalMora.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#991b1b' }}>Suma total de todas las cuentas por cobrar pendientes</span>
                    </div>
                    <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '0.9rem' }}>💧 AGUA EN MORA: ${totalMoraAgua.toFixed(2)}</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c2410c', margin: '0.5rem 0' }}>
                        {cobrosMora.length} mes(es) vencidos
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#9a3412' }}>Servicios de agua potable impagados</span>
                    </div>
                    <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#9f1239', fontWeight: 700, fontSize: '0.9rem' }}>⚠️ MULTAS PENDIENTES: ${totalMoraMultas.toFixed(2)}</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48', margin: '0.5rem 0' }}>
                        {multasMora.length} sanción(es)
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#9f1239' }}>Multas por atraso de asamblea o infracciones</span>
                    </div>
                  </div>

                  <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className="table">
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th>Cliente Deudor</th>
                          <th>Cédula / RUC</th>
                          <th>Dirección / Sector</th>
                          <th>Rubro Impago</th>
                          <th>Detalle del Período / Sanción</th>
                          <th style={{ textAlign: 'right' }}>Deuda ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cobrosMora.length === 0 && multasMora.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>¡Excelente noticia! No hay cartera vencida que coincida con este criterio.</td></tr>
                        ) : (
                          <>
                            {cobrosMora.map((c: any) => (
                              <tr key={'mora-c-'+c.id}>
                                <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{c.clientes?.nombre} {c.clientes?.apellido}</td>
                                <td>{c.clientes?.cedula}</td>
                                <td>{c.clientes?.direccion || 'N/D'}</td>
                                <td><span className="badge badge-primary" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>Servicio Agua</span></td>
                                <td>Factura de Consumo de Agua</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger-color)', fontSize: '1.1rem' }}>${Number(c.monto_total).toFixed(2)}</td>
                              </tr>
                            ))}
                            {multasMora.map((m: any) => (
                              <tr key={'mora-m-'+m.id}>
                                <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{m.clientes?.nombre} {m.clientes?.apellido}</td>
                                <td>{m.clientes?.cedula}</td>
                                <td>{m.clientes?.direccion || 'N/D'}</td>
                                <td><span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>MULTA</span></td>
                                <td>{m.categoria_multa.toUpperCase()} ({m.motivo})</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger-color)', fontSize: '1.1rem' }}>${Number(m.monto_generado).toFixed(2)}</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                          <td colSpan={5} style={{ textAlign: 'right', fontSize: '1.1rem', paddingRight: '1rem' }}>TOTAL CARTERA VENCIDA:</td>
                          <td style={{ textAlign: 'right', fontSize: '1.35rem', color: 'var(--danger-color)' }}>
                            ${granTotalMora.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* VISTA 3: REPORTE DE CONSUMOS (m³) */}
        {tipoReporte === 'consumos' && datosConsumos && (
          <div>
            {(() => {
              const totalM3 = datosConsumos.reduce((acc: number, val: any) => acc + Number(val.consumo_calculado || 0), 0);
              const maxConsumo = datosConsumos.length > 0 ? Math.max(...datosConsumos.map((c: any) => Number(c.consumo_calculado || 0))) : 0;
              const promedioM3 = datosConsumos.length > 0 ? (totalM3 / datosConsumos.length) : 0;

              return (
                <>
                  {/* Tarjetas KPI de Consumos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#1e40af', fontWeight: 700, fontSize: '0.9rem' }}>🌊 AGUA TOTAL COMUNIDAD</span>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1d4ed8', margin: '0.5rem 0' }}>
                        {totalM3.toFixed(2)} m³
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#1e40af' }}>Volumen total consumido en el mes de {mesAnio}</span>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#15803d', fontWeight: 700, fontSize: '0.9rem' }}>📊 PROMEDIO POR MEDIDOR</span>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#166534', margin: '0.5rem 0' }}>
                        {promedioM3.toFixed(1)} m³ / fam.
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#15803d' }}>Consumo medio en {datosConsumos.length} medidores</span>
                    </div>
                    <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '1.2rem', borderRadius: '12px' }}>
                      <span style={{ color: '#9a3412', fontWeight: 700, fontSize: '0.9rem' }}>🔥 MEDIDOR MÁS ALTO</span>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ea580c', margin: '0.5rem 0' }}>
                        {maxConsumo.toFixed(1)} m³
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#9a3412' }}>Verificar por posibles fugas de agua</span>
                    </div>
                  </div>

                  <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className="table">
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th>Medidor Nº</th>
                          <th>Cliente Propietario</th>
                          <th>Lectura Anterior</th>
                          <th>Lectura Actual</th>
                          <th>Consumo Calculado (m³)</th>
                          <th>Estado Facturación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datosConsumos.length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem' }}>No hay lecturas de consumo cargadas o registradas para el mes {mesAnio}.</td></tr>
                        ) : (
                          datosConsumos.map((c: any) => (
                            <tr key={'cons-'+c.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-color)' }}>{c.medidores?.numero}</td>
                              <td style={{ fontWeight: 600 }}>{c.medidores?.clientes?.nombre} {c.medidores?.clientes?.apellido}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{c.lectura_anterior} m³</td>
                              <td style={{ fontWeight: 700 }}>{c.lectura_actual} m³</td>
                              <td style={{ fontWeight: 800, color: Number(c.consumo_calculado) >= 30 ? 'var(--danger-color)' : 'var(--success-color)', fontSize: '1.1rem' }}>
                                {c.consumo_calculado} m³
                              </td>
                              <td>
                                <span className={`badge ${c.estado === 'facturado' ? 'badge-success' : 'badge-warning'}`}>
                                  {c.estado.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                          <td colSpan={4} style={{ textAlign: 'right', fontSize: '1.1rem', paddingRight: '1rem' }}>TOTAL GENERAL CONSUMIDO:</td>
                          <td colSpan={2} style={{ fontSize: '1.35rem', color: 'var(--primary-color)' }}>
                            {totalM3.toFixed(2)} m³
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
