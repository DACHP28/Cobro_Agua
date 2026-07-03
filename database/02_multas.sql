-- Migración de la tabla Multas desde SQLite a PostgreSQL (Supabase)

CREATE TABLE IF NOT EXISTS multas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    cobro_id INTEGER REFERENCES cobros(id) ON DELETE SET NULL, -- Si la multa proviene de una factura atrasada
    categoria_multa TEXT NOT NULL DEFAULT 'mora', -- 'mora', 'minga', 'sesion', 'otro'
    monto_generado NUMERIC(10, 2) NOT NULL DEFAULT 0,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'anulado'
    fecha_generacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Habilitar la seguridad RLS
ALTER TABLE multas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados en multas" 
ON multas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recargar el caché de Supabase
NOTIFY pgrst, 'reload schema';
