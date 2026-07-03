import { getMultas, getClientesBasico, getConfiguracionMultas } from './actions';
import MultasManager from './MultasManager';

export const metadata = {
  title: 'Multas y Recargos | Sistema de Cobro ERP'
}

export default async function MultasPage() {
  const [multas, clientes, config] = await Promise.all([
    getMultas(),
    getClientesBasico(),
    getConfiguracionMultas()
  ]);

  return (
    <div>
      <MultasManager initialMultas={multas} clientes={clientes} initialConfig={config} />
    </div>
  );
}
