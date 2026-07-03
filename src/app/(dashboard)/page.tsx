import { getDashboardMetrics } from './actions';
import DashboardView from './DashboardView';

export const metadata = {
  title: 'Dashboard | Sistema de Cobro ERP'
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      <DashboardView metrics={metrics} />
    </div>
  );
}
