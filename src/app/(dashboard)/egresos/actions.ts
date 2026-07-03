'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Egreso, EgresoInput } from '@/types/database.types'

export async function getEgresos(): Promise<Egreso[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('egresos')
    .select(`
      *,
      proveedores:proveedor_id (nombre, identificacion)
    `)
    .order('fecha_egreso', { ascending: false })

  if (error) {
    console.error('Error fetching egresos:', error)
    return []
  }

  return data as unknown as Egreso[]
}

export async function createEgreso(input: EgresoInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase.from('egresos').insert({
    ...input,
    fecha_egreso: input.fecha_egreso || new Date().toISOString()
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/egresos')
  return { error: null }
}
