import { getCobros, getConsumosPendientes } from './actions';
import { getMultas } from '../multas/actions';
import CobrosManager from './CobrosManager';

export const metadata = {
  title: 'Cobros y Pagos | Sistema de Cobro ERP'
}

export default async function CobrosPage() {
  const [cobros, consumosPendientes, multas] = await Promise.all([
    getCobros(),
    getConsumosPendientes(),
    getMultas()
  ]);

  return (
    <div>
      <CobrosManager initialCobros={cobros} consumosPendientes={consumosPendientes} initialMultas={multas} />
    </div>
  );
}
