'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Medidor, MedidorInput, Cliente } from '@/types/database.types'

export async function getMedidores(): Promise<Medidor[]> {
  const supabase = await createClient()
  // Usamos join con clientes para tener los datos del propietario
  const { data, error } = await supabase
    .from('medidores')
    .select(`
      *,
      clientes:cliente_id (id, nombre, apellido, cedula, codigo)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching medidores:', error)
    return []
  }

  return data as unknown as Medidor[]
}

export async function getClientesActivos(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('Error fetching clientes activos:', error)
    return []
  }

  return data as Cliente[]
}

export async function createMedidor(input: MedidorInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase.from('medidores').insert(input)

  if (error) {
    console.error('Error creating medidor:', error)
    return { error: error.message }
  }

  revalidatePath('/medidores')
  return { error: null }
}

export async function updateMedidor(id: number, input: Partial<MedidorInput>): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('medidores')
    .update(input)
    .eq('id', id)

  if (error) {
    console.error('Error updating medidor:', error)
    return { error: error.message }
  }

  revalidatePath('/medidores')
  return { error: null }
}

export async function toggleEstadoMedidor(id: number, estadoActual: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

  const { error } = await supabase
    .from('medidores')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    console.error('Error toggling estado medidor:', error)
    return { error: error.message }
  }

  revalidatePath('/medidores')
  return { error: null }
}
