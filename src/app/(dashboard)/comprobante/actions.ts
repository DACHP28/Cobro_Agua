'use server'

import { createClient } from '@/lib/supabase/server'

export async function getComprobanteAgua(id: string) {
  const supabase = await createClient();
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
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getComprobanteMulta(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('multas')
    .select(`
      *,
      clientes (
        nombre,
        apellido,
        cedula,
        direccion
      )
    `)
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
