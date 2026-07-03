import { getMedidores, getClientesActivos } from './actions';
import MedidoresManager from './MedidoresManager';

export const metadata = {
  title: 'Medidores | Sistema de Cobro ERP'
}

export default async function MedidoresPage() {
  const [medidores, clientesActivos] = await Promise.all([
    getMedidores(),
    getClientesActivos()
  ]);

  return (
    <div>
      <MedidoresManager initialMedidores={medidores} clientesActivos={clientesActivos} />
    </div>
  );
}
