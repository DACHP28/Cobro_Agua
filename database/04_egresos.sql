-- Migración de la base de datos para Egresos y Gastos Operativos (Supabase)

CREATE TABLE IF NOT EXISTS egresos (
    id SERIAL PRIMARY KEY,
    categoria TEXT NOT NULL, -- Ej: Mantenimiento, Papelería, Inventario, Sueldos, Otro
    descripcion TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'efectivo', -- efectivo, cheque, transferencia
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL, -- Opcional
    fecha_egreso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    referencia TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso total para desarrollo/pruebas
DROP POLICY IF EXISTS "Acceso total egresos" ON egresos;
CREATE POLICY "Acceso total egresos" ON egresos FOR ALL USING (true) WITH CHECK (true);

-- Recargar caché de Supabase
NOTIFY pgrst, 'reload schema';
