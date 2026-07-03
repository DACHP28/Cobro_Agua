-- PostgreSQL Schema for Sistema de Cobro ERP (Supabase)

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    -- password_hash y password_salt se manejarán idealmente con Supabase Auth.
    -- Pero para migrar usuarios locales directamente, podemos conservarlos por ahora.
    role TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL DEFAULT '',
    cedula TEXT NOT NULL UNIQUE,
    email TEXT,
    direccion TEXT,
    telefono TEXT,
    estado TEXT NOT NULL DEFAULT 'activo',
    historial TEXT,
    mora NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medidores (
    id SERIAL PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo_servicio TEXT NOT NULL,
    tecnologia TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activo',
    fecha_instalacion TIMESTAMP WITH TIME ZONE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumos (
    id SERIAL PRIMARY KEY,
    medidor_id INTEGER NOT NULL REFERENCES medidores(id) ON DELETE CASCADE,
    lectura_anterior NUMERIC(10, 2) NOT NULL DEFAULT 0,
    lectura_actual NUMERIC(10, 2) NOT NULL,
    consumo_total NUMERIC(10, 2) NOT NULL,
    fecha_lectura TIMESTAMP WITH TIME ZONE NOT NULL,
    observaciones TEXT,
    lote_carga TEXT,
    creado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarifas (
    id SERIAL PRIMARY KEY,
    tipo_medidor TEXT NOT NULL,
    tarifa_base NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tarifa_excedente NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unidad_excedente NUMERIC(10, 2) NOT NULL DEFAULT 0,
    vigencia_desde TIMESTAMP WITH TIME ZONE,
    vigencia_hasta TIMESTAMP WITH TIME ZONE,
    activa BOOLEAN NOT NULL DEFAULT true,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recibos (
    id SERIAL PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal_servicios NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal_multas NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT,
    estado TEXT NOT NULL DEFAULT 'emitido',
    pdf_url TEXT,
    sri_estado TEXT NOT NULL DEFAULT 'pendiente_local',
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_servicio (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    medidor_id INTEGER REFERENCES medidores(id),
    consumo_id INTEGER REFERENCES consumos(id),
    recibo_id INTEGER REFERENCES recibos(id),
    periodo TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS multas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    consumo_id INTEGER REFERENCES consumos(id),
    recibo_id INTEGER REFERENCES recibos(id),
    tipo_calculo TEXT NOT NULL,
    valor_base NUMERIC(10, 2) NOT NULL DEFAULT 0,
    porcentaje NUMERIC(10, 2) NOT NULL DEFAULT 0,
    monto_generado NUMERIC(10, 2) NOT NULL DEFAULT 0,
    motivo TEXT NOT NULL,
    categoria_multa TEXT NOT NULL DEFAULT 'mora',
    meses_vencidos INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    fecha_generacion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_multas (
    id SERIAL PRIMARY KEY,
    multa_id INTEGER NOT NULL REFERENCES multas(id),
    recibo_id INTEGER REFERENCES recibos(id),
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    monto_pagado NUMERIC(10, 2) NOT NULL DEFAULT 0,
    metodo_pago TEXT NOT NULL,
    referencia TEXT,
    fecha_pago TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    identificacion TEXT,
    telefono TEXT,
    direccion TEXT,
    email TEXT,
    estado TEXT NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(id),
    unidad_medida TEXT NOT NULL,
    stock_actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10, 2) NOT NULL DEFAULT 0,
    costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    precio_referencia NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    inventario_id INTEGER NOT NULL REFERENCES inventario(id),
    tipo_movimiento TEXT NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL,
    costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    referencia TEXT,
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresos (
    id SERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    metodo_pago TEXT NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(id),
    fecha_egreso TIMESTAMP WITH TIME ZONE NOT NULL,
    referencia TEXT,
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    nivel TEXT NOT NULL,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    datos_adicionales TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuraciones_generales (
    id SERIAL PRIMARY KEY,
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo_dato TEXT NOT NULL,
    seccion TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    editable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sri_secuenciales (
    id SERIAL PRIMARY KEY,
    tipo_documento TEXT NOT NULL,
    establecimiento TEXT NOT NULL,
    punto_emision TEXT NOT NULL,
    secuencial_actual INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (tipo_documento, establecimiento, punto_emision)
);

CREATE TABLE IF NOT EXISTS sri_documentos_local (
    id SERIAL PRIMARY KEY,
    recibo_id INTEGER REFERENCES recibos(id),
    tipo_documento TEXT NOT NULL,
    clave_acceso TEXT,
    establecimiento TEXT NOT NULL,
    punto_emision TEXT NOT NULL,
    secuencial INTEGER NOT NULL,
    numero_autorizacion TEXT,
    estado_local TEXT NOT NULL DEFAULT 'preparado',
    estado_sri TEXT NOT NULL DEFAULT 'pendiente_envio',
    xml_url TEXT,
    ride_url TEXT,
    signed_xml_url TEXT,
    error_detalle TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_medidores_cliente ON medidores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consumos_medidor_fecha ON consumos(medidor_id, fecha_lectura);
CREATE INDEX IF NOT EXISTS idx_pagos_servicio_cliente_fecha ON pagos_servicio(cliente_id, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_multas_cliente_estado ON multas(cliente_id, estado);
CREATE INDEX IF NOT EXISTS idx_pagos_multas_cliente_fecha ON pagos_multas(cliente_id, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha ON egresos(fecha_egreso);
CREATE INDEX IF NOT EXISTS idx_logs_modulo_fecha ON logs(modulo, created_at);
CREATE INDEX IF NOT EXISTS idx_sri_documentos_estado ON sri_documentos_local(estado_sri, estado_local);
