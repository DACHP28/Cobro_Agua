export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string | null;
  direccion: string | null;
  telefono: string | null;
  estado: string;
  historial: string | null;
  mora: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteInput {
  nombre: string;
  apellido: string;
  cedula: string;
  email?: string;
  direccion?: string;
  telefono?: string;
  estado?: string;
}

export interface Medidor {
  id: number;
  numero: string;
  cliente_id: number;
  tipo_servicio: string;
  tecnologia: string;
  estado: string;
  fecha_instalacion: string | null;
  observaciones: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Campo joining opcional
  clientes?: Cliente;
}

export interface MedidorInput {
  numero: string;
  cliente_id: number;
  tipo_servicio: string;
  tecnologia: string;
  estado?: string;
  fecha_instalacion?: string | null;
  observaciones?: string | null;
}

export interface Consumo {
  id: number;
  medidor_id: number;
  mes_anio: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_calculado: number;
  estado: string;
  fecha_lectura: string;
  observaciones: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  medidores?: Medidor;
}

export interface ConsumoInput {
  medidor_id: number;
  mes_anio: string;
  lectura_anterior: number;
  lectura_actual: number;
  consumo_calculado: number;
  estado?: string;
  observaciones?: string | null;
}

export interface Cobro {
  id: number;
  consumo_id: number;
  cliente_id: number;
  monto_subtotal: number;
  impuestos: number;
  monto_total: number;
  estado: string; // 'pendiente', 'pagado', 'anulado'
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  metodo_pago: string | null;
  referencia_pago: string | null;
  clave_acceso_sri: string | null;
  estado_sri: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined fields
  consumos?: Consumo;
  clientes?: Cliente;
}

export interface CobroInput {
  consumo_id: number;
  cliente_id: number;
  monto_subtotal: number;
  impuestos: number;
  monto_total: number;
  estado?: string;
  fecha_vencimiento?: string | null;
}

export interface Multa {
  id: number;
  cliente_id: number;
  cobro_id: number | null;
  categoria_multa: string;
  monto_generado: number;
  motivo: string;
  estado: string;
  fecha_generacion: string;
  fecha_pago: string | null;
  created_at?: string;

  // Joined fields
  clientes?: Cliente;
}

export interface MultaInput {
  cliente_id: number;
  cobro_id?: number | null;
  categoria_multa: string;
  monto_generado: number;
  motivo: string;
  estado?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  identificacion: string | null;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
  estado: string;
}

export interface ProveedorInput {
  nombre: string;
  identificacion?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
}

export interface Inventario {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor_id: number | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  precio_referencia: number;
  estado: string;
  
  proveedores?: Proveedor;
}

export interface InventarioInput {
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor_id?: number | null;
  unidad_medida: string;
  stock_actual?: number;
  stock_minimo: number;
  costo_unitario: number;
  precio_referencia?: number;
}

export interface MovimientoInventario {
  id: number;
  inventario_id: number;
  tipo_movimiento: string;
  cantidad: number;
  costo_unitario: number;
  referencia: string | null;
  observaciones: string | null;
  fecha_movimiento: string;
  
  inventario?: Inventario;
}

export interface Egreso {
  id: number;
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: string;
  proveedor_id: number | null;
  fecha_egreso: string;
  referencia: string | null;
  
  proveedores?: Proveedor;
}

export interface EgresoInput {
  categoria: string;
  descripcion: string;
  monto: number;
  metodo_pago: string;
  proveedor_id?: number | null;
  referencia?: string;
  fecha_egreso?: string;
}

export interface Usuario {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface UsuarioInput {
  username: string;
  full_name: string;
  password_hash?: string;
  role: string;
  is_active?: boolean;
}

export interface Tarifa {
  id: number;
  tipo_medidor: string;
  tarifa_base: number;
  tarifa_excedente: number;
  unidad_excedente: number; // Límite máximo de m3 incluidos
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  activa: boolean;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TarifaInput {
  tipo_medidor: string;
  tarifa_base: number;
  tarifa_excedente: number;
  unidad_excedente: number;
  activa?: boolean;
  observaciones?: string | null;
}
