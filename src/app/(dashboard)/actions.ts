'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardMetrics {
  totalClientes: number;
  totalConsumosPendientes: number;
  ingresosAgua: number;
  ingresosMultas: number;
  totalEgresos: number;
  deudaPendienteAgua: number;
  deudaPendienteMultas: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()

  const metrics: DashboardMetrics = {
    totalClientes: 0,
    totalConsumosPendientes: 0,
    ingresosAgua: 0,
    ingresosMultas: 0,
    totalEgresos: 0,
    deudaPendienteAgua: 0,
    deudaPendienteMultas: 0,
  }

  // 1. Clientes
  const { count: countClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'activo')
  metrics.totalClientes = countClientes || 0

  // 2. Consumos Pendientes
  const { count: countConsumos } = await supabase.from('consumos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
  metrics.totalConsumosPendientes = countConsumos || 0

  // 3. Cobros de Agua (Ingresos y Deudas)
  const { data: cobros } = await supabase.from('cobros').select('monto_total, estado')
  if (cobros) {
    cobros.forEach(c => {
      if (c.estado === 'pagado') metrics.ingresosAgua += Number(c.monto_total)
      else if (c.estado === 'pendiente') metrics.deudaPendienteAgua += Number(c.monto_total)
    })
  }

  // 4. Multas (Ingresos y Deudas)
  const { data: multas } = await supabase.from('multas').select('monto_generado, estado')
  if (multas) {
    multas.forEach(m => {
      if (m.estado === 'pagado') metrics.ingresosMultas += Number(m.monto_generado)
      else if (m.estado === 'pendiente') metrics.deudaPendienteMultas += Number(m.monto_generado)
    })
  }

  // 5. Egresos Totales
  const { data: egresos } = await supabase.from('egresos').select('monto')
  if (egresos) {
    egresos.forEach(e => {
      metrics.totalEgresos += Number(e.monto)
    })
  }

  return metrics;
}
