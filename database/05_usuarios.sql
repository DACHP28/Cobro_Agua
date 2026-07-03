-- Migración de la base de datos para Gestión de Personal (Usuarios del Sistema)

CREATE TABLE IF NOT EXISTS usuarios_sistema (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OPERADOR', -- ADMINISTRADOR, SUPERVISOR, OPERADOR, CAJERO
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios_sistema (username, full_name, password_hash, role)
VALUES (
    'admin', 
    'Administrador Principal', 
    '$2a$10$wE9K/vXy9M.P.t8H4j6.U.L2bY/v/kLz.5G6tJ5P5w/J2P4K3c3n2', -- Hash bcrypt para 'Admin123*'
    'ADMINISTRADOR'
) ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso total para desarrollo/pruebas
DROP POLICY IF EXISTS "Acceso total usuarios" ON usuarios_sistema;
CREATE POLICY "Acceso total usuarios" ON usuarios_sistema FOR ALL USING (true) WITH CHECK (true);

-- Recargar caché de Supabase
NOTIFY pgrst, 'reload schema';
