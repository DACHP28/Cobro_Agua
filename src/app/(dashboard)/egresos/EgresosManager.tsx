'use client'

import { useState } from 'react';
import { Egreso, Proveedor } from '@/types/database.types';
import { createEgreso } from './actions';

export default function EgresosManager({ 
  egresos, 
  proveedores 
}: { 
  egresos: Egreso[], 
  proveedores: Proveedor[] 
}) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const categorias = [
    'Mantenimiento / Reparaciones',
    'Compra de Inventario / Materiales',
    'Administrativo / Papelería',
    'Servicios Básicos (Luz, Agua, Internet)',
    'Sueldos / Remuneraciones',
    'Otro'
  ];

  const handleCrearEgreso = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const provId = formData.get('proveedor_id') as string;

    const res = await createEgreso({
      categoria: formData.get('categoria') as string,
      descripcion: formData.get('descripcion') as string,
      monto: parseFloat(formData.get('monto') as string),
      metodo_pago: formData.get('metodo_pago') as string,
      referencia: formData.get('referencia') as string,
      proveedor_id: provId ? parseInt(provId, 10) : null
    });

    if (res.error) {
      alert('Error al registrar egreso: ' + res.error);
    } else {
      setShowModal(false);
    }
    
    setLoading(false);
  };

  const totalGastos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Gastos Operativos y Egresos</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Historial de salidas de dinero de la caja.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Histórico Egresos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
            ${totalGastos.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-danger" onClick={() => setShowModal(true)}>+ Registrar Salida de Dinero</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th>Monto ($)</th>
              <th>Método / Ref.</th>
            </tr>
          </thead>
          <tbody>
            {egresos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay gastos registrados.</td>
              </tr>
            ) : (
              egresos.map(egreso => (
                <tr key={egreso.id}>
                  <td>{new Date(egreso.fecha_egreso).toLocaleDateString()}</td>
                  <td><span className="badge badge-warning">{egreso.categoria}</span></td>
                  <td><strong>{egreso.descripcion}</strong></td>
                  <td>{egreso.proveedores ? egreso.proveedores.nombre : <span style={{ color: 'var(--text-secondary)' }}>-</span>}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>
                      - ${egreso.monto.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize' }}>{egreso.metodo_pago}</span>
                    {egreso.referencia && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ref: {egreso.referencia}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--danger-color)' }}>Registrar Egreso</h2>
            
            <form onSubmit={handleCrearEgreso}>
              <div className="form-group">
                <label className="form-label">Categoría del Gasto</label>
                <select name="categoria" className="form-control" required>
                  {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción / Motivo</label>
                <input type="text" name="descripcion" className="form-control" required placeholder="Ej. Pago servicio técnico bomba de agua" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Monto a Pagar ($)</label>
                  <input type="number" step="0.01" min="0.01" name="monto" className="form-control" required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Método de Pago</label>
                  <select name="metodo_pago" className="form-control" required>
                    <option value="efectivo">Efectivo (Caja Chica)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Proveedor (Opcional)</label>
                <select name="proveedor_id" className="form-control">
                  <option value="">Ninguno / No Aplica</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)' }}>Seleccione si el pago está dirigido a una empresa del catálogo.</small>
              </div>

              <div className="form-group">
                <label className="form-label">Referencia (Cheque / Transf.)</label>
                <input type="text" name="referencia" className="form-control" placeholder="Opcional" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn btn-danger" disabled={loading}>
                  {loading ? 'Procesando...' : 'Confirmar Salida de Dinero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
