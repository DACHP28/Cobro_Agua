import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log('--- INICIANDO PRUEBAS E2E DEL BACKEND ---');

    // 1. Crear Usuario de prueba (Simulando)
    log('1. Probando creación de usuario Cajero...');
    const username = 'cajero_test_' + Date.now();
    const { error: userError } = await supabase.from('usuarios').insert({
      username: username,
      full_name: 'Cajero de Prueba',
      role: 'CAJERO',
      is_active: true
    });
    if (userError) throw new Error('Fallo al crear usuario: ' + userError.message);
    log('✅ Usuario Cajero creado exitosamente.');

    // 2. Crear Cliente de Prueba
    log('2. Probando creación de Cliente...');
    const cedula = '999999999' + Math.floor(Math.random() * 10);
    const { data: cliente, error: cliError } = await supabase.from('clientes').insert({
      nombre: 'Cliente',
      apellido: 'Test',
      cedula: cedula,
      direccion: 'Calle Falsa 123'
    }).select().single();
    if (cliError) throw new Error('Fallo al crear cliente: ' + cliError.message);
    log(`✅ Cliente creado (ID: ${cliente.id}).`);

    // 3. Crear Medidor
    log('3. Probando creación de Medidor...');
    const numMedidor = 'MED-' + Date.now();
    const { data: medidor, error: medError } = await supabase.from('medidores').insert({
      numero: numMedidor,
      cliente_id: cliente.id,
      tipo_servicio: 'Residencial',
      tecnologia: 'Análogo',
      estado: 'activo'
    }).select().single();
    if (medError) throw new Error('Fallo al crear medidor: ' + medError.message);
    log(`✅ Medidor creado (Nº: ${medidor.numero}).`);

    // 4. Crear Consumo
    log('4. Probando registro de Consumo...');
    const { data: consumo, error: conError } = await supabase.from('consumos').insert({
      medidor_id: medidor.id,
      lectura_anterior: 0,
      lectura_actual: 15,
      consumo_calculado: 15,
      mes_anio: '06-2026',
      estado: 'registrado',
      fecha_lectura: new Date().toISOString()
    }).select().single();
    if (conError) throw new Error('Fallo al registrar consumo: ' + conError.message);
    log(`✅ Consumo de 15m³ registrado exitosamente.`);

    // 5. Generar Cobro
    log('5. Probando facturación de Cobro...');
    const tarifa = 0.50; // hardcoded in actions.ts
    const total = 15 * tarifa;
    const { data: cobro, error: cobError } = await supabase.from('cobros').insert({
      consumo_id: consumo.id,
      cliente_id: cliente.id,
      monto_subtotal: total,
      impuestos: 0,
      monto_total: total,
      estado: 'pendiente'
    }).select().single();
    if (cobError) throw new Error('Fallo al generar cobro: ' + cobError.message);
    log(`✅ Factura generada por $${total} (ID: ${cobro.id}).`);

    // 6. Registrar Pago
    log('6. Probando cobro en ventanilla...');
    const { error: pagoError } = await supabase.from('cobros').update({
      estado: 'pagado',
      metodo_pago: 'efectivo',
      fecha_pago: new Date().toISOString()
    }).eq('id', cobro.id);
    if (pagoError) throw new Error('Fallo al registrar pago: ' + pagoError.message);
    log('✅ Factura pagada exitosamente.');

    // 7. Simular Egreso
    log('7. Probando registro de Egreso...');
    const { error: egresoError } = await supabase.from('egresos').insert({
      categoria: 'Mantenimiento',
      descripcion: 'Reparación Tubo Test',
      monto: 5.00,
      metodo_pago: 'efectivo',
      fecha_egreso: new Date().toISOString()
    });
    if (egresoError) throw new Error('Fallo al registrar egreso: ' + egresoError.message);
    log('✅ Gasto operativo registrado exitosamente.');

    log('--- TODAS LAS PRUEBAS BACKEND SUPERADAS CON ÉXITO ---');
    return NextResponse.json({ success: true, logs });

  } catch (err: any) {
    log('❌ ERROR FATAL DURANTE LAS PRUEBAS: ' + err.message);
    return NextResponse.json({ success: false, logs });
  }
}
