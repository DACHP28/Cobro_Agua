'use client'

import { useState, useEffect } from 'react';
import { getReporteCaja, getReporteMorosos, getReporteConsumos } from './actions';

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

  // Cargar al inicio
  useEffect(() => {
    cargarReporte();
  }, []);

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Centro de Reportes</h2>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Imprimir / Exportar PDF
        </button>
      </div>

      {/* Controles de Filtros */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
        <div>
          <label className="form-label">Tipo de Reporte</label>
          <select 
            className="form-input" 
            value={tipoReporte} 
            onChange={(e) => {
              setTipoReporte(e.target.value);
              setDatosCaja(null);
              setDatosMorosos(null);
              setDatosConsumos(null);
            }}
          >
            <option value="caja">Reporte de Caja (Ingresos/Egresos)</option>
            <option value="morosos">Reporte de Morosidad (Cartera Vencida)</option>
            <option value="consumos">Reporte de Consumos (m³)</option>
          </select>
        </div>

        {tipoReporte === 'caja' && (
          <>
            <div>
              <label className="form-label">Fecha Inicio</label>
              <input type="date" className="form-input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fecha Fin</label>
              <input type="date" className="form-input" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </>
        )}

        {tipoReporte === 'consumos' && (
          <div>
            <label className="form-label">Mes y Año (MM-YYYY)</label>
            <input type="text" className="form-input" placeholder="06-2026" value={mesAnio} onChange={(e) => setMesAnio(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" onClick={cargarReporte} disabled={loading}>
            {loading ? 'Cargando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>

      {/* Área de Impresión (Contenido del Reporte) */}
      <div id="print-area">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .no-print, .sidebar, header, .nav-item { display: none !important; }
            .main-content { margin: 0 !important; padding: 0 !important; }
            .card { border: none; box-shadow: none; padding: 0 !important; }
            body { background: white; }
          }
        `}} />

        {/* REPORTE DE CAJA */}
        {tipoReporte === 'caja' && datosCaja && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>REPORTE DE CAJA (ARQUEO)</h1>
              <p style={{ margin: 0, color: '#666' }}>Desde: {fechaInicio} - Hasta: {fechaFin}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ borderBottom: '2px solid var(--success-color)', paddingBottom: '0.5rem' }}>INGRESOS (Agua y Multas)</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosCaja.ingresosAgua.map((i: any) => (
                      <tr key={'agua'+i.id}>
                        <td>{new Date(i.fecha_pago).toLocaleDateString()}</td>
                        <td>{i.clientes?.nombre} {i.clientes?.apellido}</td>
                        <td style={{ color: 'var(--success-color)' }}>+ ${i.monto_total}</td>
                      </tr>
                    ))}
                    {datosCaja.ingresosMultas.map((i: any) => (
                      <tr key={'multa'+i.id}>
                        <td>{new Date(i.fecha_pago).toLocaleDateString()}</td>
                        <td>{i.clientes?.nombre} {i.clientes?.apellido} (Multa)</td>
                        <td style={{ color: 'var(--success-color)' }}>+ ${i.monto_generado}</td>
                      </tr>
                    ))}
                    {datosCaja.ingresosAgua.length === 0 && datosCaja.ingresosMultas.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay ingresos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 style={{ borderBottom: '2px solid var(--danger-color)', paddingBottom: '0.5rem' }}>EGRESOS (Gastos)</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosCaja.egresos.map((e: any) => (
                      <tr key={'egreso'+e.id}>
                        <td>{new Date(e.fecha_egreso).toLocaleDateString()}</td>
                        <td>{e.descripcion}</td>
                        <td style={{ color: 'var(--danger-color)' }}>- ${e.monto}</td>
                      </tr>
                    ))}
                    {datosCaja.egresos.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay egresos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', textAlign: 'right' }}>
              {(() => {
                const totalIngresos = 
                  datosCaja.ingresosAgua.reduce((acc: number, val: any) => acc + Number(val.monto_total), 0) +
                  datosCaja.ingresosMultas.reduce((acc: number, val: any) => acc + Number(val.monto_generado), 0);
                const totalEgresos = datosCaja.egresos.reduce((acc: number, val: any) => acc + Number(val.monto), 0);
                const neto = totalIngresos - totalEgresos;

                return (
                  <>
                    <div style={{ fontSize: '1.1rem' }}>Total Ingresos: <span style={{ color: 'var(--success-color)' }}>${totalIngresos.toFixed(2)}</span></div>
                    <div style={{ fontSize: '1.1rem' }}>Total Egresos: <span style={{ color: 'var(--danger-color)' }}>${totalEgresos.toFixed(2)}</span></div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', borderTop: '2px solid #ccc', paddingTop: '1rem' }}>
                      SALDO NETO: <span style={{ color: neto >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>${neto.toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* REPORTE DE MOROSOS */}
        {tipoReporte === 'morosos' && datosMorosos && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>REPORTE DE MOROSIDAD (CARTERA VENCIDA)</h1>
              <p style={{ margin: 0, color: '#666' }}>Emitido el: {new Date().toLocaleDateString()}</p>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cédula</th>
                  <th>Dirección</th>
                  <th>Tipo de Deuda</th>
                  <th>Monto Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {datosMorosos.cobros.map((c: any) => (
                  <tr key={'c'+c.id}>
                    <td>{c.clientes?.nombre} {c.clientes?.apellido}</td>
                    <td>{c.clientes?.cedula}</td>
                    <td>{c.clientes?.direccion}</td>
                    <td>Servicio de Agua</td>
                    <td style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>${c.monto_total}</td>
                  </tr>
                ))}
                {datosMorosos.multas.map((m: any) => (
                  <tr key={'m'+m.id}>
                    <td>{m.clientes?.nombre} {m.clientes?.apellido}</td>
                    <td>{m.clientes?.cedula}</td>
                    <td>{m.clientes?.direccion}</td>
                    <td>Multa ({m.motivo})</td>
                    <td style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>${m.monto_generado}</td>
                  </tr>
                ))}
                {datosMorosos.cobros.length === 0 && datosMorosos.multas.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>Excelente: No hay clientes en mora.</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL CARTERA VENCIDA:</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>
                    ${(
                      datosMorosos.cobros.reduce((acc: number, val: any) => acc + Number(val.monto_total), 0) +
                      datosMorosos.multas.reduce((acc: number, val: any) => acc + Number(val.monto_generado), 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* REPORTE DE CONSUMOS */}
        {tipoReporte === 'consumos' && datosConsumos && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>REPORTE GLOBAL DE CONSUMOS</h1>
              <p style={{ margin: 0, color: '#666' }}>Periodo: {mesAnio}</p>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Medidor Nº</th>
                  <th>Cliente</th>
                  <th>Consumo (m³)</th>
                </tr>
              </thead>
              <tbody>
                {datosConsumos.map((c: any) => (
                  <tr key={c.id}>
                    <td>{c.medidores?.numero}</td>
                    <td>{c.medidores?.clientes?.nombre} {c.medidores?.clientes?.apellido}</td>
                    <td>{c.consumo_calculado} m³</td>
                  </tr>
                ))}
                {datosConsumos.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay lecturas registradas en este periodo</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>TOTAL CONSUMIDO EN LA COMUNIDAD:</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {datosConsumos.reduce((acc: number, val: any) => acc + Number(val.consumo_calculado), 0).toFixed(2)} m³
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
