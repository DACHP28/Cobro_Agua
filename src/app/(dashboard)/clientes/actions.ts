'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Cliente, ClienteInput } from '@/types/database.types'

export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clientes:', error)
    return []
  }

  return data as Cliente[]
}

export async function createCliente(input: ClienteInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  // Generar código autoincremental simple basado en timestamp o count
  const { count } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
  const nextId = (count || 0) + 1;
  const codigo = `CLI-${nextId.toString().padStart(4, '0')}`;

  const nuevoCliente = {
    ...input,
    codigo,
  }

  const { error } = await supabase.from('clientes').insert(nuevoCliente)

  if (error) {
    console.error('Error creating cliente:', error)
    return { error: error.message }
  }

  revalidatePath('/clientes')
  return { error: null }
}

export async function updateCliente(id: number, input: Partial<ClienteInput>): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update(input)
    .eq('id', id)

  if (error) {
    console.error('Error updating cliente:', error)
    return { error: error.message }
  }

  revalidatePath('/clientes')
  return { error: null }
}

export async function toggleEstadoCliente(id: number, estadoActual: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

  const { error } = await supabase
    .from('clientes')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) {
    console.error('Error toggling estado cliente:', error)
    return { error: error.message }
  }

  revalidatePath('/clientes')
  return { error: null }
}
