'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Consumo, ConsumoInput, Medidor } from '@/types/database.types'

export async function getConsumos(): Promise<Consumo[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('consumos')
    .select(`
      *,
      medidores:medidor_id (id, numero, clientes:cliente_id (id, nombre, apellido))
    `)
    .order('fecha_lectura', { ascending: false })

  if (error) {
    console.error('Error fetching consumos:', error)
    return []
  }

  return data as unknown as Consumo[]
}

export async function getMedidoresActivos(): Promise<Medidor[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('medidores')
    .select(`
      *,
      clientes:cliente_id (id, nombre, apellido, cedula)
    `)
    .eq('estado', 'activo')
    .order('numero', { ascending: true })

  if (error) {
    console.error('Error fetching medidores activos:', error)
    return []
  }

  return data as unknown as Medidor[]
}

export async function getUltimaLectura(medidorId: number): Promise<number> {
  const supabase = await createClient()
  
  // Buscar el último consumo registrado para este medidor
  const { data, error } = await supabase
    .from('consumos')
    .select('lectura_actual')
    .eq('medidor_id', medidorId)
    .order('fecha_lectura', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // Si no hay lecturas anteriores, o hay un error, retornamos 0
    return 0
  }

  return data.lectura_actual
}

export async function createConsumo(input: ConsumoInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  // La validación matemática ya debería venir del frontend, pero la reforzamos aquí
  const consumoCalculado = input.lectura_actual - input.lectura_anterior;
  
  if (consumoCalculado < 0) {
    return { error: 'La lectura actual no puede ser menor a la lectura anterior.' }
  }

  const nuevoConsumo = {
    ...input,
    consumo_calculado: consumoCalculado
  }

  const { error } = await supabase.from('consumos').insert(nuevoConsumo)

  if (error) {
    console.error('Error creating consumo:', error)
    return { error: error.message }
  }

  revalidatePath('/consumos')
  return { error: null }
}

export async function bulkInsertConsumos(mesAnio: string, lecturasExcel: { numeroMedidor: string, lecturaActual: number }[]): Promise<{ error: string | null, resultados: any }> {
  const supabase = await createClient()

  // 1. Obtener todos los medidores activos
  const { data: medidores, error: errMedidores } = await supabase
    .from('medidores')
    .select('id, numero')
    .eq('estado', 'activo');

  if (errMedidores || !medidores) {
    return { error: 'Error al obtener el catálogo de medidores.', resultados: null };
  }

  // 2. Procesar cada fila del Excel
  const consumosAInsertar = [];
  const errores = [];

  for (const fila of lecturasExcel) {
    const medidor = medidores.find(m => String(m.numero).trim() === String(fila.numeroMedidor).trim());
    
    if (!medidor) {
      errores.push(`El medidor '${fila.numeroMedidor}' no fue encontrado en el sistema.`);
      continue;
    }

    // Buscar lectura anterior de este medidor
    let lecturaAnterior = 0;
    const { data: consumoPrevio } = await supabase
      .from('consumos')
      .select('lectura_actual')
      .eq('medidor_id', medidor.id)
      .order('fecha_lectura', { ascending: false })
      .limit(1)
      .single();

    if (consumoPrevio) {
      lecturaAnterior = consumoPrevio.lectura_actual;
    }

    const consumoCalculado = fila.lecturaActual - lecturaAnterior;

    if (consumoCalculado < 0) {
      errores.push(`Medidor '${fila.numeroMedidor}': Lectura actual (${fila.lecturaActual}) menor a la anterior (${lecturaAnterior}).`);
      continue;
    }

    consumosAInsertar.push({
      medidor_id: medidor.id,
      mes_anio: mesAnio,
      lectura_anterior: lecturaAnterior,
      lectura_actual: fila.lecturaActual,
      consumo_calculado: consumoCalculado,
      estado: 'registrado',
      fecha_lectura: new Date().toISOString()
    });
  }

  // 3. Insertar los válidos
  if (consumosAInsertar.length > 0) {
    const { error: insertError } = await supabase.from('consumos').insert(consumosAInsertar);
    if (insertError) {
      return { error: 'Ocurrió un error al guardar los consumos en la base de datos: ' + insertError.message, resultados: null };
    }
  }

  revalidatePath('/consumos')
  return { 
    error: null, 
    resultados: { 
      insertados: consumosAInsertar.length, 
      errores: errores 
    } 
  }
}
