import { getEgresos } from './actions';
import { getProveedores } from '../inventario/actions';
import EgresosManager from './EgresosManager';

export const metadata = {
  title: 'Gastos y Egresos | Sistema de Cobro ERP'
}

export default async function EgresosPage() {
  const [egresos, proveedores] = await Promise.all([
    getEgresos(),
    getProveedores()
  ]);

  return (
    <div>
      <EgresosManager egresos={egresos} proveedores={proveedores} />
    </div>
  );
}
