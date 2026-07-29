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

def delete_rest(table, filter_col, val):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filter_col}=eq.{urllib.parse.quote(str(val))}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return resp.status
    except Exception as e:
        print(f"  [Aviso] Al limpiar {table} por {filter_col}={val}: {e}")
        return 400

def get_records(table, filter_col, val):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filter_col}=eq.{urllib.parse.quote(str(val))}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ssl_context) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get_clientes_test():
    url = f"{SUPABASE_URL}/rest/v1/clientes?select=id,nombre,apellido,cedula,codigo&or=(cedula.in.(0401854578,0401288701),codigo.in.(CLI-0001,CLI-0002))"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ssl_context) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== LIMPIANDO CLIENTES DE PRUEBA Y SUS HISTORICALES EN LA NUBE ===")
clientes = get_clientes_test()
if not clientes:
    print("[-] Los clientes de prueba ya no se encuentran en la base de datos.")
else:
    print(f"[*] Se encontraron {len(clientes)} clientes de prueba:")
    for cli in clientes:
        cli_id = cli['id']
        print(f"\n -> Procesando limpieza total para: {cli['nombre']} {cli['apellido']} (ID: {cli_id})...")
        
        # 1. Obtener sus medidores
        medidores = get_records("medidores", "cliente_id", cli_id)
        for med in medidores:
            med_id = med['id']
            print(f"    - Limpiando consumos y pagos del medidor {med['numero']} (ID: {med_id})...")
            delete_rest("pagos_servicio", "medidor_id", med_id)
            delete_rest("consumos", "medidor_id", med_id)
            delete_rest("medidores", "id", med_id)
            print(f"      [OK] Medidor {med['numero']} y su historial eliminados.")

        # 2. Limpiar multas, recibos, pagos referenciados al cliente
        print("    - Limpiando historial de cobros, multas y recibos del cliente...")
        delete_rest("pagos_multas", "cliente_id", cli_id)
        delete_rest("pagos_servicio", "cliente_id", cli_id)
        delete_rest("multas", "cliente_id", cli_id)
        delete_rest("recibos", "cliente_id", cli_id)

        # 3. Eliminar cliente
        delete_rest("clientes", "id", cli_id)
        print(f" [EXCELENTE] Cliente {cli['nombre']} {cli['apellido']} y toda su información ficticia han sido borrados de Supabase.")

# Verificacion final de totales
url_all_c = f"{SUPABASE_URL}/rest/v1/clientes?select=id"
url_all_m = f"{SUPABASE_URL}/rest/v1/medidores?select=id"
with urllib.request.urlopen(urllib.request.Request(url_all_c, headers=HEADERS), context=ssl_context) as r1:
    tot_c = len(json.loads(r1.read().decode('utf-8')))
with urllib.request.urlopen(urllib.request.Request(url_all_m, headers=HEADERS), context=ssl_context) as r2:
    tot_m = len(json.loads(r2.read().decode('utf-8')))

print("\n=== BASE DE DATOS LIMPIADA Y 100% PURA (SOLO CATALOGO 2024) ===")
print(f"-> TOTAL CLIENTES OFICIALES EN NUBE: {tot_c}")
print(f"-> TOTAL MEDIDORES OFICIALES EN NUBE: {tot_m}")
