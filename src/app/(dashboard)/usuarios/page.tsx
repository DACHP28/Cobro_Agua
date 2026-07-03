import { getUsuarios } from './actions';
import UsuariosManager from './UsuariosManager';

export const metadata = {
  title: 'Personal y Accesos | Sistema de Cobro ERP'
}

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();

  return (
    <div>
      <UsuariosManager usuarios={usuarios} />
    </div>
  );
}
