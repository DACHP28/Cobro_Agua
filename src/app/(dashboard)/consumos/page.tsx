import { getConsumos, getMedidoresActivos, getTarifas } from './actions';
import ConsumosManager from './ConsumosManager';

export const metadata = {
  title: 'Consumos y Lecturas | Sistema de Cobro ERP'
}

export default async function ConsumosPage() {
  const [consumos, medidoresActivos, tarifas] = await Promise.all([
    getConsumos(),
    getMedidoresActivos(),
    getTarifas()
  ]);

  return (
    <div>
      <ConsumosManager initialConsumos={consumos} medidoresActivos={medidoresActivos} initialTarifas={tarifas} />
    </div>
  );
}
