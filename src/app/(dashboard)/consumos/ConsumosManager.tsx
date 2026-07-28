'use client'

import { useState } from 'react';
import { Consumo, Medidor, Tarifa, TarifaInput } from '@/types/database.types';
import FormConsumo from './FormConsumo';
import ExcelUploadModal from './ExcelUploadModal';
import { createOrUpdateTarifa, deleteTarifa } from './actions';

export default function ConsumosManager({ 
  initialConsumos, 
  medidoresActivos,
  initialTarifas = [] 
}: { 
  initialConsumos: Consumo[], 
  medidoresActivos: Medidor[],
  initialTarifas?: Tarifa[] 
}) {
  const [activeTab, setActiveTab] = useState<'lecturas' | 'tarifas'>('lecturas');
  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Estados para CRUD Tarifario
  const [showTarifaModal, setShowTarifaModal] = useState(false);
  const [editingTarifa, setEditingTarifa] = useState<Tarifa | null>(null);
  const [loadingTarifa, setLoadingTarifa] = useState(false);

  // Funciones modales consumos
  const handleCloseModal = () => setShowModal(false);
  const handleCloseExcelModal = () => setShowExcelModal(false);

  // Búsqueda rápida de tarifa por tipo de servicio del medidor
  const getTarifaForMedidor = (tipoServicio?: string): Tarifa | null => {
    if (!tipoServicio) return null;
    const tipo = tipoServicio.toUpperCase().trim();
    return initialTarifas.find(t => t.tipo_medidor.toUpperCase().trim() === tipo) || null;
  };

  // Guardar Tarifa (Creación / Edición)
  const handleSaveTarifa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingTarifa(true);
    const formData = new FormData(e.currentTarget);

    const input: TarifaInput = {
      tipo_medidor: formData.get('tipo_medidor') as string,
      tarifa_base: parseFloat(formData.get('tarifa_base') as string),
      unidad_excedente: parseFloat(formData.get('unidad_excedente') as string),
      tarifa_excedente: parseFloat(formData.get('tarifa_excedente') as string),
      observaciones: formData.get('observaciones') as string,
      activa: true
    };

    const res = await createOrUpdateTarifa(editingTarifa?.id || null, input);
    setLoadingTarifa(false);

    if (res.error) {
      alert('Error al guardar la regla tarifaria: ' + res.error);
    } else {
      setShowTarifaModal(false);
      setEditingTarifa(null);
    }
  };

  const handleDeleteTarifa = async (id: number, tipo: string) => {
    if (!confirm(`¿Estás seguro de eliminar la regla de consumo para medidores tipo '${tipo}'?`)) return;
    setLoadingTarifa(true);
    const res = await deleteTarifa(id);
    setLoadingTarifa(false);
    if (res.error) alert('Error: ' + res.error);
  };

  return (
    <div>
      {/* Encabezado Ejecutivo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Consumos y Límites por Medidor</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control mensual de lecturas, umbrales máximos de agua incluida y recargos por excedentes.</p>
        </div>
        
        {activeTab === 'lecturas' ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', borderRadius: '30px', fontWeight: 600, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }} onClick={() => setShowExcelModal(true)}>
              📊 Subir Excel
            </button>
            <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)', borderRadius: '30px', fontWeight: 600 }} onClick={() => setShowModal(true)}>
              + Nueva Lectura
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)', borderRadius: '30px', fontWeight: 600 }} onClick={() => { setEditingTarifa(null); setShowTarifaModal(true); }}>
            + Nueva Regla / Categoría
          </button>
        )}
      </div>

      {/* Pestañas (Tabs) Nivel Oro */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.25rem' }}>
        <button 
          onClick={() => setActiveTab('lecturas')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.05rem', cursor: 'pointer', padding: '0.5rem 0.5rem 0.75rem 0.5rem',
            fontWeight: activeTab === 'lecturas' ? 700 : 500,
            color: activeTab === 'lecturas' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'lecturas' ? '3px solid var(--primary-color)' : 'none',
            marginBottom: '-0.35rem',
            transition: 'all 0.2s ease'
          }}
        >
          📋 Registro de Lecturas ({initialConsumos.length})
        </button>
        <button 
          onClick={() => setActiveTab('tarifas')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1.05rem', cursor: 'pointer', padding: '0.5rem 0.5rem 0.75rem 0.5rem',
            fontWeight: activeTab === 'tarifas' ? 700 : 500,
            color: activeTab === 'tarifas' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'tarifas' ? '3px solid var(--primary-color)' : 'none',
            marginBottom: '-0.35rem',
            transition: 'all 0.2s ease'
          }}
        >
          ⚙️ Límites de Consumo y Tarifas ({initialTarifas.length})
        </button>
      </div>

      {/* VISTA 1: TABLA DE LECTURAS HISTÓRICAS */}
      {activeTab === 'lecturas' && (
        <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Medidor / Cliente</th>
                <th>Tipo Medidor</th>
                <th>Lec. Anterior</th>
                <th>Lec. Actual</th>
                <th>Consumo (m³) vs Límite</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {initialConsumos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚰</div>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>Sin Lecturas Registradas</strong>
                    <span style={{ fontSize: '0.9rem' }}>Ingresa tu primera lectura manualmente o carga un archivo Excel con el consumo mensual.</span>
                  </td>
                </tr>
              ) : (
                initialConsumos.map(consumo => {
                  // @ts-ignore
                  const cliNombre = consumo.medidores?.clientes?.nombre || '';
                  // @ts-ignore
                  const cliApellido = consumo.medidores?.clientes?.apellido || '';
                  const numMedidor = consumo.medidores?.numero || 'N/A';
                  // @ts-ignore
                  const tipoMedidor = consumo.medidores?.tipo_servicio || 'Residencial';

                  const tarifa = getTarifaForMedidor(tipoMedidor);
                  const excedente = tarifa && consumo.consumo_calculado > tarifa.unidad_excedente ? consumo.consumo_calculado - tarifa.unidad_excedente : 0;

                  return (
                    <tr key={consumo.id}>
                      <td><strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{consumo.mes_anio}</strong></td>
                      <td>
                        <strong>{numMedidor}</strong><br/>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cliNombre} {cliApellido}</span>
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.75rem' }}>
                          {tipoMedidor}
                        </span>
                      </td>
                      <td>{consumo.lectura_anterior} m³</td>
                      <td>{consumo.lectura_actual} m³</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: excedente > 0 ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                            {consumo.consumo_calculado} m³
                          </span>
                          {tarifa ? (
                            excedente > 0 ? (
                              <span className="badge badge-danger" style={{ fontSize: '0.75rem', width: 'fit-content', fontWeight: 600 }}>
                                ⚠️ +{excedente} m³ extra (Límite: {tarifa.unidad_excedente} m³)
                              </span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '0.75rem', width: 'fit-content', fontWeight: 600 }}>
                                ✓ En rango (Límite: {tarifa.unidad_excedente} m³)
                              </span>
                            )
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sin límite fijado</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${consumo.estado === 'facturado' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'capitalize', fontWeight: 700 }}>
                          {consumo.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 2: GESTIÓN DE TARIFAS Y LÍMITES POR TIPO DE MEDIDOR */}
      {activeTab === 'tarifas' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>💡</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-color)' }}> ¿Cómo funciona la facturación por límites de agua?</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Cuando el consumo mensual de un cliente está por debajo de los metros cúbicos incluidos, se le cobra únicamente la <strong>Tarifa Base</strong>. Si el cliente supera el <strong>Límite de m³</strong>, el sistema multiplicará cada metro cúbico excedido por el <strong>Costo por m³ Excedente</strong> y lo sumará automáticamente a su factura en ventanilla.
                </p>
              </div>
            </div>
          </div>

          <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo de Medidor / Categoría</th>
                  <th>Límite Máximo Incluido</th>
                  <th>Tarifa Base Mensual ($)</th>
                  <th>Costo por m³ Excedente ($)</th>
                  <th>Ejemplo Simulado (+5 m³ extra)</th>
                  <th>Observaciones</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {initialTarifas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>Sin Tarificadores Registrados</strong>
                      <span>Haz clic en &quot;+ Nueva Regla / Categoría&quot; para configurar el precio y volumen por defecto.</span>
                    </td>
                  </tr>
                ) : (
                  initialTarifas.map(tarifa => {
                    const simulaExcedente = 5;
                    const simulaTotal = Number(tarifa.tarifa_base) + (simulaExcedente * Number(tarifa.tarifa_excedente));
                    return (
                      <tr key={tarifa.id}>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                            🏷️ {tarifa.tipo_medidor}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                            {tarifa.unidad_excedente} m³
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Volumen base incluido</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            $ {Number(tarifa.tarifa_base).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger-color)' }}>
                            + $ {Number(tarifa.tarifa_excedente).toFixed(2)} <small style={{ fontSize: '0.8rem' }}>/ m³ extra</small>
                          </span>
                        </td>
                        <td>
                          <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <div>Base: <strong>${Number(tarifa.tarifa_base).toFixed(2)}</strong> + Extra ({simulaExcedente} m³): <strong>${(simulaExcedente * Number(tarifa.tarifa_excedente)).toFixed(2)}</strong></div>
                            <div style={{ color: 'var(--primary-color)', fontWeight: 800, marginTop: '0.2rem', fontSize: '0.95rem' }}>Total estimado: ${simulaTotal.toFixed(2)}</div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '200px' }}>
                          {tarifa.observaciones || 'Sin observaciones'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', fontWeight: 600, backgroundColor: '#fff' }}
                              onClick={() => { setEditingTarifa(tarifa); setShowTarifaModal(true); }}
                              disabled={loadingTarifa}
                            >
                              Editar
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px', fontWeight: 600, color: 'var(--danger-color)', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: '#fff' }}
                              onClick={() => handleDeleteTarifa(tarifa.id, tarifa.tipo_medidor)}
                              disabled={loadingTarifa}
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL CONFIGURACIÓN TARIFA / LÍMITE */}
      {showTarifaModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 800 }}>
              {editingTarifa ? 'Editar Límite y Tarifa' : 'Configurar Nueva Tarifa por Medidor'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Define cuántos metros cúbicos abarca el servicio normal y cuánto costará cada metro adicional superado el límite.
            </p>

            <form onSubmit={handleSaveTarifa}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Tipo de Medidor / Categoría de Servicio</label>
                <input 
                  type="text" 
                  name="tipo_medidor" 
                  className="form-control" 
                  required 
                  defaultValue={editingTarifa?.tipo_medidor || ''} 
                  placeholder="Ej. RESIDENCIAL, COMERCIAL, INDUSTRIAL, PUBLICO" 
                  style={{ textTransform: 'uppercase', fontWeight: 600 }}
                  readOnly={!!editingTarifa && ['RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'PUBLICO'].includes(editingTarifa.tipo_medidor)}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Debe coincidir con el campo &quot;Tipo de Servicio&quot; asignado en la ficha de tus medidores.
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Límite Máximo (m³ incluidos)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    name="unidad_excedente" 
                    className="form-control" 
                    required 
                    defaultValue={editingTarifa ? editingTarifa.unidad_excedente : 15}
                    placeholder="Ej. 15" 
                    style={{ fontWeight: 700, color: 'var(--primary-color)' }}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Volumen cubierto sin recargo</small>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Tarifa Base Mensual ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    name="tarifa_base" 
                    className="form-control" 
                    required 
                    defaultValue={editingTarifa ? editingTarifa.tarifa_base : 3.00}
                    placeholder="Ej. 3.00" 
                    style={{ fontWeight: 700 }}
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Precio fijo hasta el límite</small>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--danger-color)' }}>📈 Recargo por m³ Excedente ($ extra / m³)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  name="tarifa_excedente" 
                  className="form-control" 
                  required 
                  defaultValue={editingTarifa ? editingTarifa.tarifa_excedente : 0.50}
                  placeholder="Ej. 0.50"
                  style={{ fontWeight: 700, color: 'var(--danger-color)', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Costo que se cobrará por cada metro cúbico adicional que el cliente consuma por encima del Límite Máximo.
                </small>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Observaciones o Descripción</label>
                <input 
                  type="text" 
                  name="observaciones" 
                  className="form-control" 
                  defaultValue={editingTarifa?.observaciones || ''} 
                  placeholder="Ej. Aplicada a domicilios particulares" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: '30px', fontWeight: 600 }} onClick={() => setShowTarifaModal(false)} disabled={loadingTarifa}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '30px', fontWeight: 700, boxShadow: '0 4px 6px rgba(79, 70, 229, 0.25)' }} disabled={loadingTarifa}>
                  {loadingTarifa ? 'Guardando Reglas...' : '💾 Guardar Escala'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <FormConsumo medidoresActivos={medidoresActivos} onClose={handleCloseModal} />
      )}

      {showExcelModal && (
        <ExcelUploadModal onClose={handleCloseExcelModal} />
      )}
    </div>
  );
}
