-- Desbloquear acceso total (RLS) para la tabla de TARIFAS y demás tablas administrativas
-- Esto permite al backend en Next.js (Vercel) realizar creaciones y modificaciones de reglas sin bloqueos de seguridad de fila.

ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total tarifas" ON tarifas;
CREATE POLICY "Acceso total tarifas" ON tarifas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total proveedores" ON proveedores;
CREATE POLICY "Acceso total proveedores" ON proveedores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total inventario" ON inventario;
CREATE POLICY "Acceso total inventario" ON inventario FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total movimientos_inventario" ON movements_inventario;
CREATE POLICY "Acceso total movimientos_inventario" ON movimientos_inventario FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total egresos" ON egresos;
CREATE POLICY "Acceso total egresos" ON egresos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso total usuarios_sistema" ON usuarios_sistema;
CREATE POLICY "Acceso total usuarios_sistema" ON usuarios_sistema FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
