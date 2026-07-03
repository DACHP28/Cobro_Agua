-- Políticas Generales RLS para Sistema de Cobro (Usuarios Autenticados)

-- 1. CLIENTES
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en clientes" ON clientes;
CREATE POLICY "Permitir todo a usuarios autenticados en clientes" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. MEDIDORES
ALTER TABLE medidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en medidores" ON medidores;
CREATE POLICY "Permitir todo a usuarios autenticados en medidores" ON medidores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- (Puedes ejecutar este patrón para todas las tablas que vayas a usar)
