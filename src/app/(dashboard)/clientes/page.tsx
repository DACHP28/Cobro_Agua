import { getClientes } from './actions';
import ClientesManager from './ClientesManager';

export const metadata = {
  title: 'Clientes | Sistema de Cobro ERP'
}

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div>
      <ClientesManager initialClientes={clientes} />
    </div>
  );
}
