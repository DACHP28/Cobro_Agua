'use client'

import { DashboardMetrics } from './actions';
import Link from 'next/link';

export default function DashboardView({ metrics }: { metrics: DashboardMetrics }) {
  const totalIngresos = metrics.ingresosAgua + metrics.ingresosMultas;
  const saldoNeto = totalIngresos - metrics.totalEgresos;
  const totalDeuda = metrics.deudaPendienteAgua + metrics.deudaPendienteMultas;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-container" style={{ padding: '0.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Estilos específicos para impresión (Oculta botones y menús laterales en el PDF) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .nav-item, aside, header, .no-print { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
          body { background-color: white !important; }
          .card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; margin-bottom: 1.5rem !important; page-break-inside: avoid; }
          .print-full { width: 100% !important; grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* CABECERA EJECUTIVA VIP */}
      <div className="card no-print" style={{ padding: '2rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span style={{ backgroundColor: 'rgba(79, 70, 229, 0.3)', border: '1px solid rgba(129, 140, 248, 0.5)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700, color: '#c7d2fe', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              🏛️ Consola de Dirección y Presidencia
            </span>
            <h1 style={{ margin: '0.8rem 0 0.3rem 0', fontSize: '2.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
              Panel de Inteligencia Financiera
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.02rem', maxWidth: '700px' }}>
              Auditoría contable en tiempo real del flujo de caja en taquilla, cobros digitales, cartera en mora y salud operativa de la red de agua.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Link 
              href="/cobros" 
              style={{ background: '#4f46e5', color: 'white', padding: '0.8rem 1.6rem', borderRadius: '30px', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)', transition: 'transform 0.2s', fontSize: '0.95rem' }}
            >
              💸 Ventanilla de Cobros
            </Link>
            <Link 
              href="/reportes" 
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.8rem 1.5rem', borderRadius: '30px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
            >
              📊 Arqueo de Caja
            </Link>
            <button 
              onClick={handlePrint}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)', padding: '0.8rem 1.2rem', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* MEMBRETE PARA VERSIÓN IMPRESA */}
      <div style={{ display: 'none' }} className="print-header">
        <style dangerouslySetInnerHTML={{__html: `@media print { .print-header { display: block !important; text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem; } }`}} />
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>JUNTA ADMINISTRADORA DE AGUA POTABLE Y SANEAMIENTO</h2>
        <h3 style={{ margin: '0.3rem 0', fontSize: '1.2rem' }}>REPORTE EJECUTIVO Y ESTADO DE SALUD INSTITUCIONAL</h3>
        <p style={{ margin: 0, color: '#555' }}>Fecha de corte oficial: {new Date().toLocaleString()}</p>
      </div>

      {/* SECCIÓN 1: 4 TARJETAS KPI DE NIVEL BANCARIO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Card 1: Saldo Líquido y Fondo en Caja */}
        <div className="card" style={{ padding: '1.6rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: saldoNeto >= 0 ? '#10b981' : '#ef4444' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              💰 Saldo Neto Operativo
            </span>
            <span style={{ background: saldoNeto >= 0 ? '#dcfce7' : '#fee2e2', color: saldoNeto >= 0 ? '#166534' : '#991b1b', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
              {saldoNeto >= 0 ? '✔ Superávit' : '⚠ Déficit'}
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: saldoNeto >= 0 ? '#065f46' : '#991b1b', margin: '0.8rem 0 0.4rem 0' }}>
            ${saldoNeto.toFixed(2)}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total recaudado menos egresos de la institución.
          </p>
        </div>

        {/* Card 2: Efectivo Físico vs Bancarizado */}
        <div className="card" style={{ padding: '1.6rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              💵 Dinero Físico (En Cajón)
            </span>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
              Taquilla
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#1e3a8a', margin: '0.8rem 0 0.4rem 0' }}>
            ${metrics.recaudoEfectivo.toFixed(2)}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600 }}>
            🏦 En Bancos / Tarjetas: ${metrics.recaudoBanco.toFixed(2)}
          </p>
        </div>

        {/* Card 3: Cartera en Mora (Por Cobrar) */}
        <div className="card" style={{ padding: '1.6rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#f59e0b' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚠️ Cartera Vencida (Por Cobrar)
            </span>
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
              Pendientes
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#92400e', margin: '0.8rem 0 0.4rem 0' }}>
            ${totalDeuda.toFixed(2)}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Agua en mora: ${metrics.deudaPendienteAgua.toFixed(2)} | Multas: ${metrics.deudaPendienteMultas.toFixed(2)}
          </p>
        </div>

        {/* Card 4: Eficiencia de Recaudación */}
        <div className="card" style={{ padding: '1.6rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: '#8b5cf6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📊 Eficiencia de Recaudación
            </span>
            <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
              Meta: 90%
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#4c1d95', margin: '0.8rem 0 0.4rem 0' }}>
            {metrics.eficienciaRecaudoPorcentaje}%
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div style={{ height: '100%', width: `${Math.min(100, metrics.eficienciaRecaudoPorcentaje)}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '10px' }} />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: GRID DUAL DE AUDITORÍA Y FEED EN VIVO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }} className="print-full">
        
        {/* COLUMNA IZQUIERDA: DESGLOSE FINANCIERO Y SALUD COMUNITARIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Card: Balance Contable del Arqueo */}
          <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
              📑 Balance Contable e Ingresos Desglosados
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ fontSize: '1.02rem', color: '#334155' }}>💧 Ingresos por Servicios de Agua Potable</span>
              <span style={{ fontSize: '1.15rem', color: 'var(--success-color)', fontWeight: 800 }}>+ ${metrics.ingresosAgua.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ fontSize: '1.02rem', color: '#334155' }}>🚨 Ingresos por Multas y Penalizaciones</span>
              <span style={{ fontSize: '1.15rem', color: 'var(--success-color)', fontWeight: 800 }}>+ ${metrics.ingresosMultas.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', background: '#f8fafc', margin: '0.5rem -1rem', paddingLeft: '1rem', paddingRight: '1rem', borderRadius: '8px' }}>
              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>SUBTOTAL RECAUDACIÓN BRUTA:</span>
              <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '1.25rem' }}>${totalIngresos.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.02rem', color: '#64748b' }}>📉 Gastos Operativos y Salidas de Dinero (Egresos)</span>
              <span style={{ fontSize: '1.15rem', color: 'var(--danger-color)', fontWeight: 800 }}>- ${metrics.totalEgresos.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', marginTop: '1.5rem', backgroundColor: saldoNeto >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', border: `1px solid ${saldoNeto >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
              <div>
                <strong style={{ display: 'block', fontSize: '1.2rem', color: saldoNeto >= 0 ? '#166534' : '#991b1b' }}>SALDO LÍQUIDO DISPONIBLE</strong>
                <span style={{ fontSize: '0.82rem', color: saldoNeto >= 0 ? '#15803d' : '#b91c1c' }}>Fondo neto tras restar egresos operativos</span>
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: saldoNeto >= 0 ? '#15803d' : '#b91c1c' }}>
                ${saldoNeto.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card: Estado Operativo y Medidores */}
          <div className="card" style={{ padding: '1.8rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              🔧 Salud Operativa y Medidores
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'block' }}>👥 Propietarios</span>
                <span style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--primary-color)' }}>{metrics.totalClientes}</span>
              </div>
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, display: 'block' }}>⏲️ Medidores</span>
                <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0369a1' }}>{metrics.totalMedidores}</span>
              </div>
              <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '0.82rem', color: '#9a3412', fontWeight: 600, display: 'block' }}>📋 Lecturas Pendientes</span>
                <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ea580c' }}>{metrics.totalConsumosPendientes}</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: FEED EN VIVO DE ACTIVIDAD Y MOVIEMENTS EN TAQUILLA */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              ⚡ Feed de Movimientos Recientes
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '0.8rem', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
              🔴 En Vivo / Taquilla
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(!metrics.actividadesRecientes || metrics.actividadesRecientes.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <strong style={{ display: 'block', fontSize: '1.1rem' }}>Sin movimientos registrados hoy</strong>
                <span>El flujo de pagos en taquilla y salidas de dinero aparecerá en tiempo real aquí.</span>
              </div>
            ) : (
              metrics.actividadesRecientes.map((act) => {
                const esIngreso = act.tipo === 'ingreso_agua' || act.tipo === 'ingreso_multa';
                return (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: esIngreso ? '#dcfce7' : '#fee2e2', color: esIngreso ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800 }}>
                        {act.tipo === 'ingreso_agua' && '💧'}
                        {act.tipo === 'ingreso_multa' && '🚨'}
                        {act.tipo === 'egreso' && '📉'}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.98rem', color: '#1e293b' }}>
                          {act.cliente ? `${act.cliente}` : act.descripcion}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {act.descripcion}
                          </span>
                          {act.metodo && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '10px', color: '#334155', textTransform: 'capitalize' }}>
                              {act.metodo === 'efectivo' ? '💵 Efectivo' : act.metodo === 'transferencia' ? '🏦 Transferencia' : act.metodo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '1.15rem', fontWeight: 900, color: esIngreso ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {esIngreso ? `+ $${act.monto.toFixed(2)}` : `- $${act.monto.toFixed(2)}`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/reportes" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
              👉 Ver historial contable y arqueo de todos los días...
            </Link>
          </div>
        </div>

      </div>

      {/* SECCIÓN 3: BOTONES VIP DE ACCESO OPERATIVO RÁPIDO */}
      <div className="card no-print" style={{ padding: '1.8rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
          ⚡ Navegación y Operaciones Rápida de Misión Crítica
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link href="/cobros" className="btn btn-primary" style={{ padding: '0.9rem', borderRadius: '12px', textAlign: 'center', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
            💸 Ventanilla Única de Cobros
          </Link>
          <Link href="/consumos" className="btn btn-outline" style={{ padding: '0.9rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, textDecoration: 'none', background: 'white' }}>
            📝 Ingresar Lecturas de Agua ({metrics.totalConsumosPendientes})
          </Link>
          <Link href="/multas" className="btn btn-outline" style={{ padding: '0.9rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, textDecoration: 'none', background: 'white', borderColor: '#f59e0b', color: '#b45309' }}>
            🚨 Aplicar Multas de Asamblea
          </Link>
          <Link href="/egresos" className="btn btn-danger" style={{ padding: '0.9rem', borderRadius: '12px', textAlign: 'center', fontWeight: 700, textDecoration: 'none', background: '#dc2626', color: 'white' }}>
            📉 Registrar Egreso / Salida
          </Link>
        </div>
      </div>

    </div>
  );
}
