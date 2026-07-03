'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Multa, MultaInput, Cliente } from '@/types/database.types'

export async function getMultas(): Promise<Multa[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('multas')
    .select(`
      *,
      clientes:cliente_id (id, nombre, apellido, cedula)
    `)
    .order('fecha_generacion', { ascending: false })

  if (error) {
    console.error('Error fetching multas:', error)
    return []
  }

  return data as unknown as Multa[]
}

export async function getClientesBasico(): Promise<Cliente[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, apellido, cedula')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) {
    return []
  }

  return data as unknown as Cliente[]
}

export async function createMultaManual(input: MultaInput): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const nuevaMulta = {
    ...input,
    estado: 'pendiente'
  }

  const { error } = await supabase.from('multas').insert(nuevaMulta)

  if (error) {
    console.error('Error creating multa:', error)
    return { error: error.message }
  }

  revalidatePath('/multas')
  return { error: null }
}

export async function registrarPagoMulta(multaId: number): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('multas')
    .update({ 
      estado: 'pagado',
      fecha_pago: new Date().toISOString()
    })
    .eq('id', multaId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/multas')
  return { error: null }
}

export async function anularMulta(multaId: number): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('multas')
    .update({ 
      estado: 'anulado'
    })
    .eq('id', multaId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/multas')
  return { error: null }
}

export async function getConfiguracionMultas() {
  const supabase = await createClient()
  const { data } = await supabase.from('configuraciones').select('*');
  
  // Valores por defecto en caso de no existir la tabla
  let mesesTolerancia = 2;
  let montoFijo = 5.00;

  if (data) {
    const confMeses = data.find(c => c.clave === 'multa_meses_tolerancia');
    const confMonto = data.find(c => c.clave === 'multa_monto_fijo');
    if (confMeses) mesesTolerancia = parseInt(confMeses.valor, 10);
    if (confMonto) montoFijo = parseFloat(confMonto.valor);
  }

  return { mesesTolerancia, montoFijo };
}

export async function updateConfiguracionMultas(meses: number, monto: number) {
  const supabase = await createClient()
  
  // Upsert config
  await supabase.from('configuraciones').upsert({ clave: 'multa_meses_tolerancia', valor: meses.toString() }, { onConflict: 'clave' });
  await supabase.from('configuraciones').upsert({ clave: 'multa_monto_fijo', valor: monto.toString() }, { onConflict: 'clave' });
  
  return { success: true };
}

export async function auditarMorosos(): Promise<{ error: string | null, resultados: any }> {
  const supabase = await createClient()
  
  const config = await getConfiguracionMultas();
  
  // 1. Buscar todos los cobros pendientes
  const { data: cobrosPendientes, error: errCobros } = await supabase
    .from('cobros')
    .select('id, cliente_id, fecha_emision')
    .eq('estado', 'pendiente');

  if (errCobros || !cobrosPendientes) {
    return { error: 'Error al leer facturas pendientes.', resultados: null };
  }

  const multasAInsertar = [];
  const fechaActual = new Date();

  for (const cobro of cobrosPendientes) {
    const fechaEmision = new Date(cobro.fecha_emision);
    // Calcular diferencia en meses aproximada
    const diffTime = Math.abs(fechaActual.getTime() - fechaEmision.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30;

    if (diffMonths >= config.mesesTolerancia) {
      // Verificar si YA existe una multa por retraso ASOCIADA a este cobro específico
      const { data: multaExistente } = await supabase
        .from('multas')
        .select('id')
        .eq('cobro_id', cobro.id)
        .eq('categoria_multa', 'retraso')
        .single();
        
      if (!multaExistente) {
        multasAInsertar.push({
          cliente_id: cobro.cliente_id,
          cobro_id: cobro.id,
          categoria_multa: 'retraso',
          monto_generado: config.montoFijo,
          motivo: `Multa por retraso de pago en factura #${cobro.id} (+${config.mesesTolerancia} meses)`,
          estado: 'pendiente',
          fecha_generacion: new Date().toISOString()
        });
      }
    }
  }

  if (multasAInsertar.length > 0) {
    const { error: insertErr } = await supabase.from('multas').insert(multasAInsertar);
    if (insertErr) {
      return { error: 'Fallo al insertar multas: ' + insertErr.message, resultados: null };
    }
  }

  revalidatePath('/multas');
  return { error: null, resultados: { generadas: multasAInsertar.length } };
}
