-- Desbloquear acceso total (ya que la seguridad se maneja en Next.js Middleware)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total clientes" ON clientes;
CREATE POLICY "Acceso total clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE medidores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total medidores" ON medidores;
CREATE POLICY "Acceso total medidores" ON medidores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE consumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total consumos" ON consumos;
CREATE POLICY "Acceso total consumos" ON consumos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total cobros" ON cobros;
CREATE POLICY "Acceso total cobros" ON cobros FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE multas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total multas" ON multas;
CREATE POLICY "Acceso total multas" ON multas FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
