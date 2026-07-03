import { getProveedores, getInventario, getMovimientos } from './actions';
import InventarioManager from './InventarioManager';

export const metadata = {
  title: 'Inventario y Proveedores | Sistema de Cobro ERP'
}

export default async function InventarioPage() {
  const [proveedores, inventario, movimientos] = await Promise.all([
    getProveedores(),
    getInventario(),
    getMovimientos()
  ]);

  return (
    <div>
      <InventarioManager proveedores={proveedores} inventario={inventario} movimientos={movimientos} />
    </div>
  );
}
