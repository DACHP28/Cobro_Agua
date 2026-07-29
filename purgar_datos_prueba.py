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

def get_all_ids(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=id"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return [r['id'] for r in json.loads(resp.read().decode('utf-8'))]
    except Exception as e:
        return []

def delete_by_id(table, record_id):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{record_id}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    with urllib.request.urlopen(req, context=ssl_context) as resp:
        return resp.status

print("=== PURGA TOTAL DE HISTORICALES Y DATOS DE PRUEBA EN LA NUBE ===")

tablas_transaccionales = [
    "pagos_multas",
    "pagos_servicio",
    "cobros",
    "recibos",
    "consumos",
    "multas"
]

for tabla in tablas_transaccionales:
    ids = get_all_ids(tabla)
    if ids:
        print(f"[*] Limpiando tabla '{tabla}': encontradas {len(ids)} filas de prueba...")
        for r_id in ids:
            delete_by_id(tabla, r_id)
        print(f"    [OK] Todas las filas en '{tabla}' eliminadas con exito.")
    else:
        print(f"[-] Tabla '{tabla}' ya se encontraba vacía.")

print("\n--- ELIMINACION DEFINITIVA DE CLIENTE Y MEDIDOR DE PRUEBA ---")
# Ahora que consumos y cobros están en cero, Juan Ordoñez y su medidor se borraran fácilmente
def delete_where_cedula(cedula):
    url = f"{SUPABASE_URL}/rest/v1/clientes?select=id,nombre,apellido,codigo&cedula=eq.{cedula}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ssl_context) as r:
        data = json.loads(r.read().decode('utf-8'))
        if data:
            cli = data[0]
            cli_id = cli['id']
            print(f"[*] Borrando medidores del cliente {cli['nombre']} {cli['apellido']} (ID: {cli_id})...")
            url_m = f"{SUPABASE_URL}/rest/v1/medidores?cliente_id=eq.{cli_id}"
            urllib.request.urlopen(urllib.request.Request(url_m, headers=HEADERS, method='DELETE'), context=ssl_context)
            
            print(f"[*] Borrando perfil oficial del cliente de prueba ({cli['codigo']})...")
            url_c = f"{SUPABASE_URL}/rest/v1/clientes?id=eq.{cli_id}"
            urllib.request.urlopen(urllib.request.Request(url_c, headers=HEADERS, method='DELETE'), context=ssl_context)
            print(f"    [¡EXCITO TOTAL!] Cliente '{cli['nombre']} {cli['apellido']}' eliminado del sistema.")
        else:
            print(f"[-] Cliente con cédula {cedula} ya no está en la base de datos.")

delete_where_cedula("0401288701") # Juan Ordoñez
delete_where_cedula("0401854578") # Juan Perez (por si quedara residuo)

print("\n=== VERIFICACION Y ESTADO DEFINITIVO DE TU NUBE INMACULADA ===")
c_consumos = len(get_all_ids('consumos'))
c_cobros = len(get_all_ids('cobros'))
c_clientes = len(get_all_ids('clientes'))
c_medidores = len(get_all_ids('medidores'))

print(f" -> Registro de Consumos en BD: {c_consumos} (Puro)")
print(f" -> Registro de Cobros y Ventanilla en BD: {c_cobros} (Puro)")
print(f" -> TOTAL CLIENTES OFICIALES ACTUALES: {c_clientes}")
print(f" -> TOTAL MEDIDORES OFICIALES ACTUALES: {c_medidores}")
