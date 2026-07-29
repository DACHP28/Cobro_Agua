'use server'

import { createClient } from '@/lib/supabase/server'

export async function getComprobanteAgua(idsParam: string) {
  const supabase = await createClient();
  const idArray = idsParam.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
  if (idArray.length === 0) return null;

  const { data, error } = await supabase
    .from('cobros')
    .select(`
      *,
      clientes:cliente_id (
        nombre,
        apellido,
        cedula,
        direccion
      ),
      consumos:consumo_id ( 
        mes_anio, 
        consumo_calculado,
        medidores:medidor_id (
          numero
        )
      )
    `)
    .in('id', idArray)
    .order('fecha_emision', { ascending: true });

  if (error || !data || data.length === 0) return null;
  return data;
}

export async function getComprobanteMulta(idsParam: string) {
  const supabase = await createClient();
  const idArray = idsParam.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
  if (idArray.length === 0) return null;

  const { data, error } = await supabase
    .from('multas')
    .select(`
      *,
      clientes:cliente_id (
        nombre,
        apellido,
        cedula,
        direccion
      )
    `)
    .in('id', idArray)
    .order('fecha_generacion', { ascending: true });

  if (error || !data || data.length === 0) return null;
  return data;
}

