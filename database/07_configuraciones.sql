CREATE TABLE IF NOT EXISTS configuraciones (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT
);

-- Insertar configuraciones por defecto
INSERT INTO configuraciones (clave, valor, descripcion) VALUES
('multa_meses_tolerancia', '2', 'Cantidad de meses de mora antes de aplicar la multa por retraso'),
('multa_monto_fijo', '5.00', 'Valor fijo en dólares de la multa por retraso de pago')
ON CONFLICT (clave) DO NOTHING;

-- Dar permisos (Todos los usuarios autenticados pueden leer, pero la UI bloqueará la edición)
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total configuraciones" ON configuraciones;
CREATE POLICY "Acceso total configuraciones" ON configuraciones FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
