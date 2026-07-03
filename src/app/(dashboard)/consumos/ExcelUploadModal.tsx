'use client'

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkInsertConsumos } from './actions';

export default function ExcelUploadModal({ onClose }: { onClose: () => void }) {
  const [mesAnio, setMesAnio] = useState(() => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
  
  const [datosPrevia, setDatosPrevia] = useState<{ numeroMedidor: string, lecturaActual: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success', texto: string } | null>(null);
  const [resultados, setResultados] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Mapear los datos asumiendo que las columnas se llaman Numero_Medidor y Lectura_Actual
        const lecturas: { numeroMedidor: string, lecturaActual: number }[] = [];
        data.forEach((row: any) => {
          const med = row['Numero_Medidor'] || row['numero_medidor'] || row['Medidor'];
          const lec = row['Lectura_Actual'] || row['lectura_actual'] || row['Lectura'];
          
          if (med !== undefined && lec !== undefined) {
            lecturas.push({
              numeroMedidor: String(med),
              lecturaActual: Number(lec)
            });
          }
        });

        if (lecturas.length === 0) {
          setMensaje({ tipo: 'error', texto: 'No se encontraron las columnas "Numero_Medidor" y "Lectura_Actual" en el Excel.' });
        } else {
          setDatosPrevia(lecturas);
          setMensaje(null);
          setResultados(null);
        }
      } catch (err) {
        setMensaje({ tipo: 'error', texto: 'Error al leer el archivo Excel.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleGuardar = async () => {
    if (datosPrevia.length === 0) return;
    setLoading(true);
    setMensaje(null);
    setResultados(null);

    const res = await bulkInsertConsumos(mesAnio, datosPrevia);
    setLoading(false);

    if (res.error) {
      setMensaje({ tipo: 'error', texto: res.error });
    } else {
      setResultados(res.resultados);
      if (res.resultados.errores.length === 0) {
        setMensaje({ tipo: 'success', texto: `¡Éxito! Se guardaron ${res.resultados.insertados} lecturas.` });
      } else {
        setMensaje({ tipo: 'error', texto: `Se guardaron ${res.resultados.insertados} lecturas, pero hubo errores en ${res.resultados.errores.length} filas.` });
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h3>Carga Masiva de Consumos (Excel)</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Período de Facturación (Mes-Año)</label>
          <input 
            type="text" 
            className="form-input" 
            value={mesAnio} 
            onChange={(e) => setMesAnio(e.target.value)} 
            placeholder="06-2026"
            disabled={loading || resultados}
          />
        </div>

        {!resultados && (
          <div style={{ marginBottom: '1.5rem', border: '2px dashed #ccc', padding: '2rem', textAlign: 'center', borderRadius: '8px' }}>
            <p>Selecciona tu archivo Excel (.xlsx o .xls)</p>
            <p style={{ fontSize: '0.8rem', color: '#666' }}>Debe contener las columnas "Numero_Medidor" y "Lectura_Actual"</p>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload} 
              disabled={loading}
              style={{ marginTop: '1rem' }}
            />
          </div>
        )}

        {mensaje && (
          <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: mensaje.tipo === 'error' ? '#fde8e8' : '#e1fdf4', color: mensaje.tipo === 'error' ? 'var(--danger-color)' : 'var(--success-color)' }}>
            <strong>{mensaje.texto}</strong>
          </div>
        )}

        {resultados && resultados.errores.length > 0 && (
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--danger-color)', padding: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--danger-color)' }}>
            <strong>Detalle de Errores:</strong>
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
              {resultados.errores.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {datosPrevia.length > 0 && !resultados && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4>Vista Previa ({datosPrevia.length} filas detectadas)</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee' }}>
              <table className="table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Medidor</th>
                    <th>Lectura Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {datosPrevia.slice(0, 50).map((fila, idx) => (
                    <tr key={idx}>
                      <td>{fila.numeroMedidor}</td>
                      <td>{fila.lecturaActual}</td>
                    </tr>
                  ))}
                  {datosPrevia.length > 50 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center' }}>... y {datosPrevia.length - 50} filas más</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {resultados ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {!resultados && datosPrevia.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
              {loading ? 'Procesando...' : `Guardar ${datosPrevia.length} Lecturas`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
