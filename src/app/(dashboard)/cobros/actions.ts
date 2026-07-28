'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Cobro, Consumo } from '@/types/database.types'

const TARIFA_POR_M3 = 0.50; // Tarifa fija de $0.50 por metro cúbico

export async function getCobros(): Promise<Cobro[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('cobros')
    .select(`
      *,
      clientes:cliente_id (id, nombre, apellido, cedula),
      consumos:consumo_id (id, mes_anio, consumo_calculado)
    `)
    .order('fecha_emision', { ascending: false })

  if (error) {
    console.error('Error fetching cobros:', error)
    return []
  }

  return data as unknown as Cobro[]
}

export async function getConsumosPendientes(): Promise<Consumo[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('consumos')
    .select(`
      *,
      medidores:medidor_id (
        id, numero, tipo_servicio, 
        clientes:cliente_id (id, nombre, apellido, cedula)
      )
    `)
    .eq('estado', 'registrado') // Solo los que no han sido facturados
    .order('fecha_lectura', { ascending: false })

  if (error) {
    console.error('Error fetching consumos pendientes:', error)
    return []
  }

  return data as unknown as Consumo[]
}

export async function generarCobro(consumoId: number, clienteId: number, metrosConsumidos: number, montoCustom?: number): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  let montoSubtotal = 0;
  if (montoCustom !== undefined && !isNaN(montoCustom) && montoCustom > 0) {
    montoSubtotal = parseFloat(Number(montoCustom).toFixed(2));
  } else {
    montoSubtotal = parseFloat((metrosConsumidos * TARIFA_POR_M3).toFixed(2));
  }
  const montoTotal = montoSubtotal; // Asumiendo 0 impuestos por ahora para el servicio básico de agua

  // Iniciar una transacción simulada (hacer insert del cobro y update del consumo)
  const { error: insertError } = await supabase.from('cobros').insert({
    consumo_id: consumoId,
    cliente_id: clienteId,
    monto_subtotal: montoSubtotal,
    impuestos: 0,
    monto_total: montoTotal,
    estado: 'pendiente'
  })

  if (insertError) {
    return { error: insertError.message }
  }

  // Marcar consumo como facturado
  await supabase.from('consumos').update({ estado: 'facturado' }).eq('id', consumoId);

  revalidatePath('/cobros')
  revalidatePath('/consumos') // Actualizar también la pantalla de consumos
  return { error: null }
}

export async function registrarPago(cobroId: number, metodoPago: string, referenciaPago: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cobros')
    .update({ 
      estado: 'pagado',
      metodo_pago: metodoPago,
      referencia_pago: referenciaPago || null,
      fecha_pago: new Date().toISOString()
    })
    .eq('id', cobroId)

  if (error) {
    console.error('Error registrando pago:', error)
    return { error: error.message }
  }

  revalidatePath('/cobros')
  return { error: null }
}
