'use server'

import { createClient } from '@/lib/supabase/server'

// 1. REPORTE DE CAJA (Ingresos vs Egresos)
export async function getReporteCaja(fechaInicio: string, fechaFin: string) {
  const supabase = await createClient()

  // Ingresos por Cobros (Agua)
  const { data: cobrosData } = await supabase
    .from('cobros')
    .select('*, clientes:cliente_id(nombre, apellido)')
    .eq('estado', 'pagado')
    .gte('fecha_pago', fechaInicio)
    .lte('fecha_pago', fechaFin + 'T23:59:59Z');

  // Ingresos por Multas
  const { data: multasData } = await supabase
    .from('multas')
    .select('*, clientes:cliente_id(nombre, apellido)')
    .eq('estado', 'pagado')
    .gte('fecha_pago', fechaInicio)
    .lte('fecha_pago', fechaFin + 'T23:59:59Z');

  // Egresos
  const { data: egresosData } = await supabase
    .from('egresos')
    .select('*')
    .gte('fecha_egreso', fechaInicio)
    .lte('fecha_egreso', fechaFin + 'T23:59:59Z');

  return {
    ingresosAgua: cobrosData || [],
    ingresosMultas: multasData || [],
    egresos: egresosData || []
  }
}

// 2. REPORTE DE MOROSOS
export async function getReporteMorosos() {
  const supabase = await createClient()

  // Buscar cobros pendientes
  const { data: cobrosPendientes } = await supabase
    .from('cobros')
    .select('*, clientes:cliente_id(nombre, apellido, cedula, direccion)')
    .eq('estado', 'pendiente');

  // Buscar multas pendientes
  const { data: multasPendientes } = await supabase
    .from('multas')
    .select('*, clientes:cliente_id(nombre, apellido, cedula, direccion)')
    .eq('estado', 'pendiente');

  return {
    cobros: cobrosPendientes || [],
    multas: multasPendientes || []
  }
}

// 3. REPORTE DE CONSUMOS
export async function getReporteConsumos(mesAnio: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('consumos')
    .select('*, medidores:medidor_id(numero, clientes:cliente_id(nombre, apellido))')
    .eq('mes_anio', mesAnio);

  return data || [];
}
