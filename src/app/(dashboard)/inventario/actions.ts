'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Proveedor, Inventario, MovimientoInventario, ProveedorInput, InventarioInput } from '@/types/database.types'

// PROVEEDORES
export async function getProveedores(): Promise<Proveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return []
  return data as unknown as Proveedor[]
}

export async function createProveedor(input: ProveedorInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').insert(input)
  if (error) return { error: error.message }
  revalidatePath('/inventario')
  return { error: null }
}

// INVENTARIO
export async function getInventario(): Promise<Inventario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventario')
    .select(`
      *,
      proveedores:proveedor_id (nombre)
    `)
    .order('nombre', { ascending: true })

  if (error) return []
  return data as unknown as Inventario[]
}

export async function createProducto(input: InventarioInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.from('inventario').insert(input)
  if (error) return { error: error.message }
  revalidatePath('/inventario')
  return { error: null }
}

// MOVIMIENTOS KARDEX
export async function getMovimientos(): Promise<MovimientoInventario[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .select(`
      *,
      inventario:inventario_id (nombre, codigo, unidad_medida)
    `)
    .order('fecha_movimiento', { ascending: false })

  if (error) return []
  return data as unknown as MovimientoInventario[]
}

export async function registrarMovimiento(
  inventarioId: number, 
  tipo: 'entrada' | 'salida', 
  cantidad: number, 
  observaciones: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  // 1. Obtener producto actual para saber el stock y costo
  const { data: prod } = await supabase.from('inventario').select('stock_actual, costo_unitario').eq('id', inventarioId).single()
  
  if (!prod) return { error: 'Producto no encontrado' }

  const nuevoStock = tipo === 'entrada' 
    ? Number(prod.stock_actual) + Number(cantidad)
    : Number(prod.stock_actual) - Number(cantidad)

  if (nuevoStock < 0) return { error: 'Stock insuficiente para realizar esta salida' }

  // 2. Registrar el movimiento
  const { error: movError } = await supabase.from('movimientos_inventario').insert({
    inventario_id: inventarioId,
    tipo_movimiento: tipo,
    cantidad: cantidad,
    costo_unitario: prod.costo_unitario,
    observaciones: observaciones,
    fecha_movimiento: new Date().toISOString()
  })

  if (movError) return { error: movError.message }

  // 3. Actualizar el stock
  await supabase.from('inventario').update({ stock_actual: nuevoStock }).eq('id', inventarioId)

  revalidatePath('/inventario')
  return { error: null }
}
