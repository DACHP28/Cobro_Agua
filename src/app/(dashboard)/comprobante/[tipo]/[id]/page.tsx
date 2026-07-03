import { getComprobanteAgua, getComprobanteMulta } from '../../actions';
import ComprobanteView from './ComprobanteView';

export const metadata = {
  title: 'Comprobante de Pago | Junta de Agua'
}

export default async function ComprobantePage({ params }: { params: Promise<{ tipo: string, id: string }> }) {
  const p = await params;
  const tipo = p.tipo as 'agua' | 'multa';
  const id = p.id;

  let data = null;
  if (tipo === 'agua') {
    data = await getComprobanteAgua(id);
  } else if (tipo === 'multa') {
    data = await getComprobanteMulta(id);
  }

  return (
    <div>
      <ComprobanteView data={data} tipo={tipo} />
    </div>
  );
}
