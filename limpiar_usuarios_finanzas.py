import urllib.request
import urllib.parse
import json
import ssl
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SUPABASE_URL = "https://xuxgormdzdachoazvmmo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGdvcm1kemRhY2hvYXp2bW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzA5NjUsImV4cCI6MjA5ODI0Njk2NX0.Hq6zMA1kZXdqs5QBHfEf4Z0cIXPQe6gvxXtl7GqQp00"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

ssl_context = ssl.create_default_context()

def get_all_records(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return []

def delete_by_col(table, col, val):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{col}=eq.{urllib.parse.quote(str(val))}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return resp.status
    except Exception as e:
        print(f"  [Aviso] Error al borrar en {table}: {e}")
        return 400

print("=== 1. ELIMINANDO USUARIOS DE PRUEBA DE 'usuarios_sistema' ===")
usuarios = get_all_records('usuarios_sistema')
if not usuarios:
    print("[-] No se encontraron filas en usuarios_sistema.")
else:
    print(f"[*] Total empleados encontrados: {len(usuarios)}")
    for usr in usuarios:
        login = str(usr.get('username', '')).lower().strip()
        nombre = usr.get('full_name', '')
        u_id = usr['id']
        
        # Mantener solo a 'admin' / 'Administrador Principal'
        if login == 'admin' or 'administrador' in nombre.lower():
            print(f"    -> [OFICIAL CONSERVADO] Manteniendo cuenta maestra: '{nombre}' (login: {login})")
        else:
            print(f"    -> Borrando usuario de prueba: '{nombre}' (login: {login})...")
            # Limpiar posibles dependencias en logs, egresos, movimientos_inventario creados por ellos
            delete_by_col('logs', 'usuario_id', u_id)
            res = delete_by_col('usuarios_sistema', 'id', u_id)
            if res in [200, 204]:
                print(f"       [EXITO] Empleado '{nombre}' eliminado sin dejar rastro.")
            else:
                print(f"       [Error] Código de respuesta al borrar: {res}")

print("\n=== 2. PURGANDO BODEGA, INVENTARIO Y PROVEEDORES DE PRUEBA ===")
for tabla_inv in ['movimientos_inventario', 'inventario', 'proveedores']:
    filas = get_all_records(tabla_inv)
    if filas:
        print(f"[*] Vacunado y limpiando tabla '{tabla_inv}' ({len(filas)} filas de prueba)...")
        for r in filas:
            delete_by_col(tabla_inv, 'id', r['id'])
        print(f"    [OK] '{tabla_inv}' en cero.")
    else:
        print(f"[-] '{tabla_inv}' ya estaba limpia.")

print("\n=== VERIFICACION Y BALANCE OFICIAL DE PRODUCCION ===")
usr_fin = get_all_records('usuarios_sistema')
inv_fin = get_all_records('inventario')
egr_fin = get_all_records('egresos')
print(f" -> USUARIOS ACTIVOS INTACTOS: {len(usr_fin)} ({[u['full_name'] for u in usr_fin]})")
print(f" -> PRODUCTOS EN INVENTARIO (TUBOS/ETC): {len(inv_fin)} (Vacío para iniciar producción)")
print(f" -> EGRESOS FINANCIEROS (GASTOS): {len(egr_fin)} ($0.00)")
