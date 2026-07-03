-- Migración de la base de datos para Proveedores e Inventario (Supabase)

-- 1. Tabla de Proveedores
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

-- 2. Tabla de Inventario (Catálogo de Productos)
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    unidad_medida TEXT NOT NULL,
    stock_actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(10, 2) NOT NULL DEFAULT 0,
    costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    precio_referencia NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Movimientos (Kardex Historial)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    inventario_id INTEGER NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
    tipo_movimiento TEXT NOT NULL, -- 'entrada', 'salida', 'ajuste'
    cantidad NUMERIC(10, 2) NOT NULL,
    costo_unitario NUMERIC(10, 2) NOT NULL DEFAULT 0,
    referencia TEXT,
    observaciones TEXT,
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios en proveedores" ON proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios en inventario" ON inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios en movimientos" ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recargar caché
NOTIFY pgrst, 'reload schema';
