'use client'

import { useState } from 'react';
import { Medidor, MedidorInput, Cliente } from '@/types/database.types';
import { createMedidor, updateMedidor } from './actions';

interface FormMedidorProps {
  medidorInicial?: Medidor | null;
  clientesActivos: Cliente[];
  onClose: () => void;
}

export default function FormMedidor({ medidorInicial, clientesActivos, onClose }: FormMedidorProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = !!medidorInicial;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const input: MedidorInput = {
      numero: formData.get('numero') as string,
      cliente_id: parseInt(formData.get('cliente_id') as string, 10),
      tipo_servicio: formData.get('tipo_servicio') as string,
      tecnologia: 'N/A', // Valor por defecto ya que el usuario pidió quitarlo visualmente
      estado: formData.get('estado') as string,
      fecha_instalacion: (formData.get('fecha_instalacion') as string) || null,
      observaciones: (formData.get('observaciones') as string) || null,
    };

    let result;
    if (isEditing) {
      result = await updateMedidor(medidorInicial.id, input);
    } else {
      result = await createMedidor(input);
    }

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
          {isEditing ? 'Editar Medidor' : 'Nuevo Medidor'}
        </h2>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cliente Propietario</label>
            <select name="cliente_id" className="form-control" defaultValue={medidorInicial?.cliente_id || ''} required>
              <option value="" disabled>Seleccione un cliente...</option>
              {clientesActivos.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido} - {cliente.cedula}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Número de Medidor (Serial)</label>
              <input type="text" name="numero" className="form-control" defaultValue={medidorInicial?.numero} required placeholder="Ej. A-12345678" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Instalación</label>
              <input type="date" name="fecha_instalacion" className="form-control" defaultValue={medidorInicial?.fecha_instalacion?.split('T')[0] || ''} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Tipo de Servicio</label>
              <select name="tipo_servicio" className="form-control" defaultValue={medidorInicial?.tipo_servicio || 'Domestico'}>
                <option value="Domestico">Domestico (Residencial)</option>
                <option value="Residencial">Residencial</option>
                <option value="Riego">Riego (Agrícola)</option>
                <option value="Comercial">Comercial / Negocios</option>
                <option value="Industrial">Industrial</option>
                <option value="Publico">Publico / Institucional</option>
                <option value="Comunitario">Comunitario</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select name="estado" className="form-control" defaultValue={medidorInicial?.estado || 'activo'}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="mantenimiento">En Mantenimiento</option>
              <option value="dado_baja">Dado de Baja</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <input type="text" name="observaciones" className="form-control" defaultValue={medidorInicial?.observaciones || ''} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Medidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
