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
    <div className="dashboard-container">
      {/* Estilos para impresión (Oculta botones y menús laterales en el PDF) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .nav-item, aside, .no-print { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 0 !important; }
          body { background-color: white !important; }
          .card { border: 1px solid #ccc !important; box-shadow: none !important; margin-bottom: 2rem !important; }
          h2 { margin-top: 0 !important; }
        }
      `}} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Dashboard Ejecutivo</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Resumen financiero en tiempo real, balance de caja fuerte y métricas clave de recaudación.</p>
        </div>
        <button className="btn btn-outline no-print" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', borderRadius: '30px', fontWeight: 600, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onClick={handlePrint}>
          🖨️ Imprimir Reporte de Caja
        </button>
      </div>

      {/* Tarjetas de Resumen (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Saldo en Caja Fuerte</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: saldoNeto >= 0 ? 'var(--primary-color)' : 'var(--danger-color)' }}>
            $ {saldoNeto.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Clientes Activos</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
            {metrics.totalClientes}
          </p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Por Cobrar (Agua + Multas)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--warning-color)' }}>
            $ {totalDeuda.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Cierre Financiero Desglosado */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          Desglose Financiero (Reporte de Caja)
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
          <span>Ingresos por Servicios (Agua)</span>
          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>+ $ {metrics.ingresosAgua.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem' }}>
          <span>Ingresos por Multas y Penalizaciones</span>
          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>+ $ {metrics.ingresosMultas.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>SUBTOTAL INGRESOS</span>
          <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>$ {totalIngresos.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <span>Gastos Operativos (Egresos)</span>
          <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>- $ {metrics.totalEgresos.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: saldoNeto >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>SALDO NETO EN CAJA</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: saldoNeto >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
            $ {saldoNeto.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Enlaces Rápidos (No se imprimen) */}
      <div className="card no-print">
        <h3 style={{ marginBottom: '1rem' }}>Accesos Rápidos Operativos</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/consumos" className="btn btn-outline">Ingresar Lecturas de Medidor ({metrics.totalConsumosPendientes} pendientes)</Link>
          <Link href="/cobros" className="btn btn-primary">Centro de Cobros en Ventanilla</Link>
          <Link href="/egresos" className="btn btn-danger">Registrar Salida de Dinero</Link>
          <Link href="/multas" className="btn btn-outline" style={{ borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }}>
            Aplicar Multa Manual
          </Link>
        </div>
      </div>
    </div>
  );
}
