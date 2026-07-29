'use client'

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ComprobanteView({ data, tipo }: { data: any, tipo: 'agua' | 'multa' }) {
  useEffect(() => {
    // Estilos de impresión para formato A5 (2 por hoja A4)
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        .no-print, .sidebar, header, .nav-item { display: none !important; }
        .main-content { margin-left: 0 !important; padding: 0 !important; }
        body { background-color: white !important; margin: 0; padding: 0; }
        
        /* Contenedor principal que ocupa toda la hoja A4 */
        .print-container {
          display: flex;
          flex-direction: column;
          height: 100vh; /* Alto de la página A4 */
          width: 100%;
        }

        /* Cada comprobante ocupa exactamente la mitad (A5) */
        .comprobante-half {
          height: 50vh;
          padding: 1rem 2rem;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Línea de corte punteada en el medio de la hoja */
        .cut-line {
          border-top: 1px dashed #000;
          width: 100%;
          position: absolute;
          top: 50vh;
          left: 0;
        }

        .comprobante-container { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); }
  }, []);

  const registros = Array.isArray(data) ? data : [data];
  const primerRegistro = registros[0];
  if (!primerRegistro) return <div style={{ padding: '2rem' }}>Comprobante no encontrado</div>;

  const isAgua = tipo === 'agua';
  const cliente = primerRegistro.clientes;
  const montoTotal = registros.reduce((acc, r) => acc + Number(isAgua ? (r.monto_total || 0) : (r.monto_generado || 0)), 0);
  const fecha = primerRegistro.fecha_pago || primerRegistro.created_at || new Date().toISOString();
  const serieIds = registros.map(r => String(r.id).padStart(5, '0')).join(' / ');

  // Renderiza el contenido de un solo recibo
  const ReceiptContent = ({ titulo }: { titulo: string }) => (
    <div className="comprobante-container card" style={{ padding: '2rem', backgroundColor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Image src="/logo.png" alt="Logo Junta de Agua" width={80} height={80} style={{ objectFit: 'contain' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', color: '#000', textTransform: 'uppercase' }}>
              Junta Administradora de Agua Potable y Saneamiento
            </h2>
            <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold' }}>Mariscal Sucre</div>
            <div style={{ fontSize: '0.8rem', color: '#555' }}>RUC: 0491517182001</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, color: isAgua ? 'var(--primary-color)' : 'var(--danger-color)', fontSize: '1.2rem' }}>
            {isAgua ? 'RECIBO AGUA' : 'RECIBO MULTAS'}
          </h1>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#000' }}>Nº {serieIds}</div>
          <div style={{ fontSize: '0.8rem', color: '#555' }}>{new Date(fecha).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#000', fontWeight: 'bold', marginTop: '0.2rem', padding: '0.2rem 0.5rem', border: '1px solid #000', borderRadius: '4px', display: 'inline-block' }}>
            {titulo}
          </div>
        </div>
      </div>

      {/* Datos del Cliente */}
      <div style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '0.6rem', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div><strong>Nombres:</strong> {cliente?.nombre} {cliente?.apellido}</div>
          <div><strong>Cédula/RUC:</strong> {cliente?.cedula || 'N/A'}</div>
          <div><strong>Dirección:</strong> {cliente?.direccion || 'N/A'}</div>
          {isAgua && <div><strong>Medidor(es):</strong> {Array.from(new Set(registros.map((r: any) => r.consumos?.medidores?.numero))).join(', ')}</div>}
        </div>
      </div>

      {/* Detalle de rubros pagados */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#e2e8f0', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
            <th style={{ padding: '0.6rem', textAlign: 'left' }}>DESCRIPCIÓN / RUBROS PAGADOS</th>
            <th style={{ padding: '0.6rem', textAlign: 'right', width: '120px' }}>SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((reg: any, idx: number) => {
            const montoFila = isAgua ? reg.monto_total : reg.monto_generado;
            return (
              <tr key={`${reg.id}-${idx}`} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.6rem' }}>
                  {isAgua ? (
                    <>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>Servicio de Agua Potable — <strong>{reg.consumos?.mes_anio}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Consumo facturado: {reg.consumos?.consumo_calculado} m³ (Medidor: {reg.consumos?.medidores?.numero || 'S/N'})
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, color: '#991b1b' }}>Sanción / Multa — <strong>{String(reg.categoria_multa || 'MORA').toUpperCase()}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Motivo: {reg.motivo}
                      </div>
                    </>
                  )}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>
                  $ {Number(montoFila || 0).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #000', backgroundColor: '#f1f5f9' }}>
            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem' }}>TOTAL RECIBIDO:</td>
            <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-color)' }}>
              $ {Number(montoTotal).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Firmas */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'auto', paddingTop: '1.5rem', fontSize: '0.8rem' }}>
        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '220px', paddingTop: '0.5rem' }}>
          <strong>Firma del Cliente</strong><br/>
          C.I: {cliente?.cedula || '........................'}
        </div>
        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '220px', paddingTop: '0.5rem' }}>
          <strong>Recaudación y Ventanilla</strong><br/>
          Junta Administradora de Agua
        </div>
      </div>
    </div>
  );


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <Link href="/cobros" className="btn btn-outline">← Volver a Cobros</Link>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir 2 Comprobantes (A5)</button>
      </div>

      <div className="print-container">
        <div className="comprobante-half">
          <ReceiptContent titulo="ORIGINAL (JUNTA)" />
        </div>
        
        <div className="cut-line no-print" style={{ textAlign: 'center', margin: '2rem 0', color: '#aaa', fontSize: '0.8rem' }}>
          ✂️ - - - - - - - - - - - - LÍNEA DE CORTE - - - - - - - - - - - - ✂️
        </div>

        <div className="comprobante-half">
          <ReceiptContent titulo="COPIA (CLIENTE)" />
        </div>
      </div>
    </div>
  );
}
