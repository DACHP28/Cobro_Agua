'use client'

import { useState } from 'react';
import { Cliente, ClienteInput } from '@/types/database.types';
import { createCliente, updateCliente } from './actions';

interface FormClienteProps {
  clienteInicial?: Cliente | null;
  onClose: () => void;
}

export default function FormCliente({ clienteInicial, onClose }: FormClienteProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = !!clienteInicial;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const input: ClienteInput = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      cedula: formData.get('cedula') as string,
      email: formData.get('email') as string,
      telefono: formData.get('telefono') as string,
      direccion: formData.get('direccion') as string,
      estado: formData.get('estado') as string,
    };

    let result;
    if (isEditing) {
      result = await updateCliente(clienteInicial.id, input);
    } else {
      result = await createCliente(input);
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
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombres</label>
              <input type="text" name="nombre" className="form-control" defaultValue={clienteInicial?.nombre} required />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos</label>
              <input type="text" name="apellido" className="form-control" defaultValue={clienteInicial?.apellido} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Cédula / RUC</label>
              <input type="text" name="cedula" className="form-control" defaultValue={clienteInicial?.cedula} required />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select name="estado" className="form-control" defaultValue={clienteInicial?.estado || 'activo'}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input type="email" name="email" className="form-control" defaultValue={clienteInicial?.email || ''} />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="text" name="telefono" className="form-control" defaultValue={clienteInicial?.telefono || ''} />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input type="text" name="direccion" className="form-control" defaultValue={clienteInicial?.direccion || ''} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
