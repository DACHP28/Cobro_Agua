'use client'

import { useState, useEffect } from 'react';
import { Medidor, ConsumoInput } from '@/types/database.types';
import { createConsumo, getUltimaLectura } from './actions';

interface FormConsumoProps {
  medidoresActivos: Medidor[];
  onClose: () => void;
}

export default function FormConsumo({ medidoresActivos, onClose }: FormConsumoProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [medidorId, setMedidorId] = useState<number | ''>('');
  const [lecturaAnterior, setLecturaAnterior] = useState<number>(0);
  const [lecturaActual, setLecturaActual] = useState<number | ''>('');
  const [cargandoLectura, setCargandoLectura] = useState(false);

  // Obtener mes actual por defecto (Ej: "2026-07")
  const fechaActual = new Date();
  const mesActualStr = `${fechaActual.getFullYear()}-${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
  const [mesAnio, setMesAnio] = useState(mesActualStr);

  useEffect(() => {
    if (medidorId !== '') {
      fetchUltimaLectura(medidorId as number);
    }
  }, [medidorId]);

  async function fetchUltimaLectura(id: number) {
    setCargandoLectura(true);
    try {
      const ultima = await getUltimaLectura(id);
      setLecturaAnterior(ultima);
    } catch (err) {
      console.error(err);
      setLecturaAnterior(0);
    } finally {
      setCargandoLectura(false);
    }
  }

  const consumoCalculado = (typeof lecturaActual === 'number' ? lecturaActual : 0) - lecturaAnterior;
  const esInvalido = consumoCalculado < 0 && typeof lecturaActual === 'number';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (esInvalido) {
      setErrorMsg('La lectura actual no puede ser menor a la anterior.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const input: ConsumoInput = {
      medidor_id: medidorId as number,
      mes_anio: mesAnio,
      lectura_anterior: lecturaAnterior,
      lectura_actual: lecturaActual as number,
      consumo_calculado: consumoCalculado,
      estado: 'registrado',
      observaciones: formData.get('observaciones') as string || null,
    };

    const result = await createConsumo(input);

    if (result.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          Registrar Nueva Lectura
        </h2>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Medidor</label>
              <select 
                className="form-control" 
                value={medidorId}
                onChange={(e) => setMedidorId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required
              >
                <option value="" disabled>Seleccione un medidor...</option>
                {medidoresActivos.map(medidor => (
                  <option key={medidor.id} value={medidor.id}>
                    {medidor.numero} ({medidor.clientes?.nombre} {medidor.clientes?.apellido})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Período de Facturación (Mes-Año)</label>
              <input 
                type="month" 
                className="form-control" 
                value={mesAnio}
                onChange={(e) => setMesAnio(e.target.value)}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Lectura Anterior (m³)</label>
              <input 
                type="number" 
                className="form-control" 
                value={cargandoLectura ? '...' : lecturaAnterior}
                readOnly
                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Lectura Actual (m³)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-control" 
                value={lecturaActual}
                onChange={(e) => setLecturaActual(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required 
                placeholder="Ej. 150.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Consumo Total</label>
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                textAlign: 'center',
                backgroundColor: typeof lecturaActual === 'number' ? (esInvalido ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)') : '#f1f5f9',
                color: typeof lecturaActual === 'number' ? (esInvalido ? 'var(--danger-color)' : 'var(--success-color)') : '#94a3b8'
              }}>
                {typeof lecturaActual === 'number' ? `${consumoCalculado.toFixed(2)} m³` : '- m³'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones (Opcional)</label>
            <input type="text" name="observaciones" className="form-control" placeholder="Ej. Medidor con tierra, fuga detectada..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || esInvalido || medidorId === ''}>
              {loading ? 'Guardando...' : 'Guardar Lectura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
