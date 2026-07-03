'use client'

import { useState } from 'react';
import { Consumo, Medidor } from '@/types/database.types';
import FormConsumo from './FormConsumo';
import ExcelUploadModal from './ExcelUploadModal';

export default function ConsumosManager({ initialConsumos, medidoresActivos }: { initialConsumos: Consumo[], medidoresActivos: Medidor[] }) {
  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Registro de Consumos y Lecturas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => setShowExcelModal(true)}>
            📊 Subir Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nueva Lectura
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Medidor / Cliente</th>
              <th>Lec. Anterior</th>
              <th>Lec. Actual</th>
              <th>Consumo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {initialConsumos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay lecturas registradas.</td>
              </tr>
            ) : (
              initialConsumos.map(consumo => {
                // @ts-ignore
                const clienteNombre = consumo.medidores?.clientes?.nombre || '';
                // @ts-ignore
                const clienteApellido = consumo.medidores?.clientes?.apellido || '';
                const numeroMedidor = consumo.medidores?.numero || 'Desconocido';

                return (
                  <tr key={consumo.id}>
                    <td><strong>{consumo.mes_anio}</strong></td>
                    <td>
                      {numeroMedidor}<br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{clienteNombre} {clienteApellido}</span>
                    </td>
                    <td>{consumo.lectura_anterior} m³</td>
                    <td>{consumo.lectura_actual} m³</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {consumo.consumo_calculado} m³
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${consumo.estado === 'registrado' ? 'badge-success' : 'badge-warning'}`}>
                        {consumo.estado}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <FormConsumo medidoresActivos={medidoresActivos} onClose={handleCloseModal} />
      )}

      {showExcelModal && (
        <ExcelUploadModal onClose={handleCloseExcelModal} />
      )}
    </div>
  );
}
