'use server'

import { createClient } from '@/lib/supabase/server'

export interface ActividadReciente {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: 'ingreso_agua' | 'ingreso_multa' | 'egreso';
  metodo?: string;
  cliente?: string;
}

export interface DashboardMetrics {
  totalClientes: number;
  totalMedidores: number;
  totalConsumosPendientes: number;
  ingresosAgua: number;
  ingresosMultas: number;
  totalEgresos: number;
  deudaPendienteAgua: number;
  deudaPendienteMultas: number;
  recaudoEfectivo: number;
  recaudoBanco: number;
  eficienciaRecaudoPorcentaje: number;
  actividadesRecientes: ActividadReciente[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()

  const metrics: DashboardMetrics = {
    totalClientes: 0,
    totalMedidores: 0,
    totalConsumosPendientes: 0,
    ingresosAgua: 0,
    ingresosMultas: 0,
    totalEgresos: 0,
    deudaPendienteAgua: 0,
    deudaPendienteMultas: 0,
    recaudoEfectivo: 0,
    recaudoBanco: 0,
    eficienciaRecaudoPorcentaje: 100,
    actividadesRecientes: []
  }

  // 1. Clientes y Medidores
  const { count: countClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('estado', 'activo')
  metrics.totalClientes = countClientes || 0

  const { count: countMedidores } = await supabase.from('medidores').select('*', { count: 'exact', head: true })
  metrics.totalMedidores = countMedidores || 0

  // 2. Consumos Pendientes
  const { count: countConsumos } = await supabase.from('consumos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
  metrics.totalConsumosPendientes = countConsumos || 0

  // 3. Cobros de Agua (Ingresos, Deudas y Desglose por Método)
  const { data: cobros } = await supabase.from('cobros').select('monto_total, estado, metodo_pago, fecha_pago, id, clientes:cliente_id(nombre, apellido)')
  const actividades: ActividadReciente[] = [];

  if (cobros) {
    cobros.forEach(c => {
      const monto = Number(c.monto_total || 0);
      if (c.estado === 'pagado') {
        metrics.ingresosAgua += monto;
        const metodo = (c.metodo_pago || 'efectivo').toLowerCase();
        if (metodo === 'efectivo') {
          metrics.recaudoEfectivo += monto;
        } else {
          metrics.recaudoBanco += monto;
        }
        if (c.fecha_pago) {
          const cliNombre = `${(c.clientes as any)?.nombre || ''} ${(c.clientes as any)?.apellido || ''}`.trim() || 'Cliente';
          actividades.push({
            id: `agua-${c.id}`,
            fecha: c.fecha_pago,
            descripcion: 'Pago Servicio de Agua Potable',
            monto: monto,
            tipo: 'ingreso_agua',
            metodo: metodo,
            cliente: cliNombre
          });
        }
      }
      else if (c.estado === 'pendiente') {
        metrics.deudaPendienteAgua += monto;
      }
    })
  }

  // 4. Multas (Ingresos, Deudas y Desglose por Método)
  const { data: multas } = await supabase.from('multas').select('monto_generado, estado, fecha_pago, id, motivo, clientes:cliente_id(nombre, apellido)')
  if (multas) {
    multas.forEach(m => {
      const monto = Number(m.monto_generado || 0);
      if (m.estado === 'pagado') {
        metrics.ingresosMultas += monto;
        const metodo = ((m as any).metodo_pago || 'efectivo').toLowerCase();
        if (metodo === 'efectivo') {
          metrics.recaudoEfectivo += monto;
        } else {
          metrics.recaudoBanco += monto;
        }
        if (m.fecha_pago) {
          const cliNombre = `${(m.clientes as any)?.nombre || ''} ${(m.clientes as any)?.apellido || ''}`.trim() || 'Cliente';
          actividades.push({
            id: `multa-${m.id}`,
            fecha: m.fecha_pago,
            descripcion: `Pago de Multa (${m.motivo || 'General'})`,
            monto: monto,
            tipo: 'ingreso_multa',
            metodo: metodo,
            cliente: cliNombre
          });
        }
      }
      else if (m.estado === 'pendiente') {
        metrics.deudaPendienteMultas += monto;
      }
    })
  }

  // 5. Egresos Totales
  const { data: egresos } = await supabase.from('egresos').select('id, monto, fecha_egreso, descripcion')
  if (egresos) {
    egresos.forEach(e => {
      const monto = Number(e.monto || 0);
      metrics.totalEgresos += monto;
      if (e.fecha_egreso) {
        actividades.push({
          id: `egr-${e.id}`,
          fecha: e.fecha_egreso,
          descripcion: e.descripcion || 'Gasto operativo / salida de caja',
          monto: monto,
          tipo: 'egreso'
        });
      }
    })
  }

  // Calcular porcentaje de eficiencia (Recaudado vs Facturado Total)
  const totalRecaudado = metrics.ingresosAgua + metrics.ingresosMultas;
  const totalFacturado = totalRecaudado + metrics.deudaPendienteAgua + metrics.deudaPendienteMultas;
  if (totalFacturado > 0) {
    metrics.eficienciaRecaudoPorcentaje = Math.round((totalRecaudado / totalFacturado) * 100);
  } else {
    metrics.eficienciaRecaudoPorcentaje = 100;
  }

  // Ordenar actividades recientes por fecha descendente (tomar las 7 más recientes para el Feed)
  metrics.actividadesRecientes = actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 7);

  return metrics;
}
