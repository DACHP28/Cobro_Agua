'use client'

import { useState } from 'react';
import { Proveedor, Inventario, MovimientoInventario, ProveedorInput, InventarioInput } from '@/types/database.types';
import { createProveedor, createProducto, registrarMovimiento } from './actions';

export default function InventarioManager({ 
  proveedores, 
  inventario, 
  movimientos 
}: { 
  proveedores: Proveedor[], 
  inventario: Inventario[], 
  movimientos: MovimientoInventario[] 
}) {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'proveedores' | 'kardex'>('catalogo');
  const [loading, setLoading] = useState(false);

  // Modales
  const [showProvModal, setShowProvModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState<Inventario | null>(null);

  // Funciones Submit
  const handleCrearProveedor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProveedor({
      nombre: formData.get('nombre') as string,
      identificacion: formData.get('identificacion') as string,
      telefono: formData.get('telefono') as string,
    });
    if (res.error) alert('Error al guardar: ' + res.error);
    setLoading(false);
    setShowProvModal(false);
  };

  const handleCrearProducto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createProducto({
      codigo: formData.get('codigo') as string,
      nombre: formData.get('nombre') as string,
      categoria: formData.get('categoria') as string,
      unidad_medida: formData.get('unidad_medida') as string,
      stock_minimo: parseFloat(formData.get('stock_minimo') as string),
      costo_unitario: parseFloat(formData.get('costo_unitario') as string),
      proveedor_id: formData.get('proveedor_id') ? parseInt(formData.get('proveedor_id') as string) : null,
    });
    if (res.error) alert('Error al guardar: ' + res.error);
    setLoading(false);
    setShowProdModal(false);
  };

  const handleMovimiento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productoSeleccionado) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const tipo = formData.get('tipo') as 'entrada' | 'salida';
    const cant = parseFloat(formData.get('cantidad') as string);
    const obs = formData.get('observaciones') as string;

    const res = await registrarMovimiento(productoSeleccionado.id, tipo, cant, obs);
    if (res.error) alert(res.error);
    
    setLoading(false);
    setShowMovModal(false);
    setProductoSeleccionado(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Inventario y Proveedores</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión integral de bodega, kardex de movimientos y catálogo de proveedores.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('catalogo')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 1rem',
            fontWeight: activeTab === 'catalogo' ? 'bold' : 'normal',
            color: activeTab === 'catalogo' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'catalogo' ? '2px solid var(--primary-color)' : 'none'
          }}
        >
          Bodega (Catálogo)
        </button>
        <button 
          onClick={() => setActiveTab('kardex')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 1rem',
            fontWeight: activeTab === 'kardex' ? 'bold' : 'normal',
            color: activeTab === 'kardex' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'kardex' ? '2px solid var(--primary-color)' : 'none'
          }}
        >
          Historial Movimientos (Kardex)
        </button>
        <button 
          onClick={() => setActiveTab('proveedores')}
          style={{ 
            background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.5rem 1rem',
            fontWeight: activeTab === 'proveedores' ? 'bold' : 'normal',
            color: activeTab === 'proveedores' ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'proveedores' ? '2px solid var(--primary-color)' : 'none'
          }}
        >
          Proveedores
        </button>
      </div>

      {/* VISTA 1: BODEGA */}
      {activeTab === 'catalogo' && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)', borderRadius: '30px' }} onClick={() => setShowProdModal(true)}>+ Nuevo Producto</button>
          </div>
          <div className="table-container" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre / Categoría</th>
                  <th>Proveedor</th>
                  <th>Stock Mínimo</th>
                  <th>Stock Actual</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {inventario.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block' }}>Catálogo de Bodega en Cero</strong>
                      <span style={{ fontSize: '0.9rem' }}>Listo para producción sin datos de prueba. Haz clic en &quot;+ Nuevo Producto&quot; para registrar material.</span>
                    </td>
                  </tr>
                ) : (
                inventario.map(prod => {
                  const bajoStock = prod.stock_actual <= prod.stock_minimo;
                  return (
                    <tr key={prod.id} style={{ backgroundColor: bajoStock ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td>{prod.codigo}</td>
                      <td>
                        <strong>{prod.nombre}</strong><br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{prod.categoria} ({prod.unidad_medida})</span>
                      </td>
                      <td>{prod.proveedores?.nombre || '-'}</td>
                      <td>{prod.stock_minimo}</td>
                      <td>
                        <span style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.2rem',
                          color: bajoStock ? 'var(--danger-color)' : 'var(--success-color)' 
                        }}>
                          {prod.stock_actual}
                        </span>
                        {bajoStock && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}>¡Bajo Stock!</span>}
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => { setProductoSeleccionado(prod); setShowMovModal(true); }}>
                          Ajustar Stock
                        </button>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VISTA 2: KARDEX */}
      {activeTab === 'kardex' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map(mov => (
                <tr key={mov.id}>
                  <td>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                  <td>{mov.inventario?.nombre} ({mov.inventario?.codigo})</td>
                  <td>
                    <span className={`badge ${mov.tipo_movimiento === 'entrada' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>
                      {mov.tipo_movimiento}
                    </span>
                  </td>
                  <td>{mov.cantidad} {mov.inventario?.unidad_medida}</td>
                  <td>{mov.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 3: PROVEEDORES */}
      {activeTab === 'proveedores' && (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowProvModal(true)}>+ Nuevo Proveedor</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Identificación (RUC)</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map(prov => (
                  <tr key={prov.id}>
                    <td><strong>{prov.nombre}</strong></td>
                    <td>{prov.identificacion}</td>
                    <td>{prov.telefono}</td>
                    <td><span className="badge badge-success">{prov.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL PROVEEDOR */}
      {showProvModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Registrar Proveedor</h2>
            <form onSubmit={handleCrearProveedor}>
              <div className="form-group"><label className="form-label">Nombre/Razón Social</label><input type="text" name="nombre" className="form-control" required /></div>
              <div className="form-group"><label className="form-label">RUC / Identificación</label><input type="text" name="identificacion" className="form-control" /></div>
              <div className="form-group"><label className="form-label">Teléfono</label><input type="text" name="telefono" className="form-control" /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProvModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO */}
      {showProdModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Registrar Producto</h2>
            <form onSubmit={handleCrearProducto}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">Código SKU</label><input type="text" name="codigo" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Nombre</label><input type="text" name="nombre" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Categoría</label><input type="text" name="categoria" className="form-control" required placeholder="Ej. Tuberías, Medidores"/></div>
                <div className="form-group"><label className="form-label">Unidad de Medida</label><input type="text" name="unidad_medida" className="form-control" required placeholder="Ej. Unidades, Metros"/></div>
                <div className="form-group"><label className="form-label">Stock Mínimo</label><input type="number" step="0.01" name="stock_minimo" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Costo Referencial ($)</label><input type="number" step="0.01" name="costo_unitario" className="form-control" required /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor Habitual</label>
                <select name="proveedor_id" className="form-control">
                  <option value="">Ninguno</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProdModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO (KARDEX) */}
      {showMovModal && productoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Ajustar Stock: {productoSeleccionado.nombre}</h2>
            <form onSubmit={handleMovimiento}>
              <div className="form-group">
                <label className="form-label">Tipo de Movimiento</label>
                <select name="tipo" className="form-control" required>
                  <option value="entrada">Entrada (Compra / Devolución)</option>
                  <option value="salida">Salida (Instalación / Merma)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad ({productoSeleccionado.unidad_medida})</label>
                <input type="number" step="0.01" min="0.01" name="cantidad" className="form-control" required />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo / Observación</label>
                <input type="text" name="observaciones" className="form-control" required placeholder="Ej. Compra Fra. 001, Usado en medidor #55" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowMovModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Guardar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
