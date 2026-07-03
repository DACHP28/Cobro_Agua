import { getConsumos, getMedidoresActivos } from './actions';
import ConsumosManager from './ConsumosManager';

export const metadata = {
  title: 'Consumos y Lecturas | Sistema de Cobro ERP'
}

export default async function ConsumosPage() {
  const [consumos, medidoresActivos] = await Promise.all([
    getConsumos(),
    getMedidoresActivos()
  ]);

  return (
    <div>
      <ConsumosManager initialConsumos={consumos} medidoresActivos={medidoresActivos} />
    </div>
  );
}
