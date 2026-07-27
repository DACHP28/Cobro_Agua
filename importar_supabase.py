import urllib.request
import urllib.parse
import json
import ssl
import sys
import io
from datetime import datetime
import openpyxl

# Configurar consola Windows para evitar problemas de caracteres/emojis
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SUPABASE_URL = "https://xuxgormdzdachoazvmmo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGdvcm1kemRhY2hvYXp2bW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzA5NjUsImV4cCI6MjA5ODI0Njk2NX0.Hq6zMA1kZXdqs5QBHfEf4Z0cIXPQe6gvxXtl7GqQp00"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

ssl_context = ssl.create_default_context()

def get_all(table, select_cols="*"):
    records = []
    offset = 0
    limit = 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/{table}?select={select_cols}&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data:
                break
            records.extend(data)
            if len(data) < limit:
                break
            offset += limit
    return records

def post_record(table, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return json.loads(resp.read().decode('utf-8'))[0]
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        raise RuntimeError(f"HTTP {e.code} - {err_body}")

print("=== INICIANDO SUBIDA A SUPABASE (NUBE / VERCEL) ===")
print("1. Consultando clientes y medidores actuales en tu nube...")
try:
    clientes_nube = {str(c['cedula']).strip(): c['id'] for c in get_all("clientes", "id,cedula") if c.get("cedula")}
    medidores_nube = {str(m['numero']).strip() for m in get_all("medidores", "numero") if m.get("numero")}
    print(f"[-] Clientes actualmente en Supabase: {len(clientes_nube)}")
    print(f"[-] Medidores actualmente en Supabase: {len(medidores_nube)}")
except Exception as e:
    print(f"[ERROR CRITICO] No se pudo conectar a Supabase: {e}")
    sys.exit(1)

print("-" * 70)

excel_path = r"C:\Users\david\Downloads\LIBRO_DE_AGUA_2024_CLIENTES_estado.xlsx"
wb = openpyxl.load_workbook(excel_path, data_only=True)
sheet = wb["LECTURA DE MEDIDOR"]
rows = list(sheet.iter_rows(values_only=True))[3:] # Desde fila 4 en adelante

stats = {
    "total_filas": 0,
    "omitidos_sin_cedula": 0,
    "clientes_insertados": 0,
    "clientes_reutilizados": 0,
    "medidores_insertados": 0,
    "medidores_omitidos_vacio": 0,
    "medidores_omitidos_repetido": 0
}

print(">> Subiendo registros del Excel a tu servidor web en tiempo real...")
for idx, row in enumerate(rows, start=4):
    if all(c is None or str(c).strip() == "" for c in row):
        continue
    stats["total_filas"] += 1

    nombres = str(row[0] or "").strip()
    apellidos = str(row[1] or "").strip()
    direccion = str(row[2] or "").strip() or "Direccion no especificada"
    medidor = str(row[3] or "").strip()
    ced_raw = row[4]
    cel_raw = row[5]
    correo = str(row[6] or "").strip()
    estado_raw = str(row[7] or "").strip().lower()

    # REGLA 1: Omitir si no tiene cedula
    if ced_raw is None or str(ced_raw).strip() in ("", "None", "0", "-", "S/N", "SIN CEDULA"):
        stats["omitidos_sin_cedula"] += 1
        continue

    cedula = str(ced_raw).strip().split(".")[0]
    if len(cedula) == 9 and not cedula.startswith("0"):
        cedula = "0" + cedula
    elif len(cedula) == 8 and not cedula.startswith("0"):
        cedula = "00" + cedula

    celular = ""
    if cel_raw is not None and str(cel_raw).strip() not in ("None", "0", ""):
        cel_str = str(cel_raw).strip().split(".")[0]
        if len(cel_str) == 9 and cel_str.startswith("9"):
            cel_str = "0" + cel_str
        celular = cel_str

    if correo in ("None", "-", "", "N/A", "no tiene"):
        correo = None

    estado = "activo"
    if "inac" in estado_raw:
        estado = "inactivo"
    elif "susp" in estado_raw:
        estado = "suspendido"

    # Gestion de Cliente en Supabase
    if cedula not in clientes_nube:
        payload_cli = {
            "codigo": cedula,
            "nombre": nombres,
            "apellido": apellidos,
            "cedula": cedula,
            "email": correo,
            "direccion": direccion,
            "telefono": celular,
            "estado": estado,
            "mora": 0.0
        }
        try:
            nuevo_cli = post_record("clientes", payload_cli)
            cliente_id = nuevo_cli["id"]
            clientes_nube[cedula] = cliente_id
            stats["clientes_insertados"] += 1
        except Exception as e:
            print(f"  [ERROR CLIENTE] Fila {idx} ({cedula} - {nombres}): {e}")
            continue
    else:
        cliente_id = clientes_nube[cedula]
        stats["clientes_reutilizados"] += 1

    # REGLAS 2 y 3: Gestion de Medidor en Supabase
    if medidor in ("", "None", "0", "-", "S/N", "SIN MEDIDOR"):
        stats["medidores_omitidos_vacio"] += 1
    elif medidor in medidores_nube:
        stats["medidores_omitidos_repetido"] += 1
    else:
        payload_med = {
            "numero": medidor,
            "cliente_id": cliente_id,
            "tipo_servicio": "Domestico",
            "tecnologia": "No aplica",
            "estado": estado,
            "observaciones": "Importado del Libro de Agua 2024 (Supabase)"
        }
        try:
            nuevo_med = post_record("medidores", payload_med)
            medidores_nube.add(medidor)
            stats["medidores_insertados"] += 1
        except Exception as e:
            print(f"  [ERROR MEDIDOR] Fila {idx} (Medidor {medidor}): {e}")

print("\n=== ¡IMPORTACION A SUPABASE FINALIZADA CON EXITO! ===")
print(f"[*] Total filas del Excel evaluadas: {stats['total_filas']}")
print(f"[-] Clientes omitidos al no tener cedula (Regla 1): {stats['omitidos_sin_cedula']}")
print(f"[+] Clientes nuevos cargados en Supabase: {stats['clientes_insertados']}")
print(f"[*] Registros vinculados al mismo perfil de cliente (propiedades adicionales): {stats['clientes_reutilizados']}")
print(f"[+] Medidores unicos enlazados y activados en Supabase: {stats['medidores_insertados']}")
print(f"[-] Medidores no creados por estar vacias/sin numero (Regla 2): {stats['medidores_omitidos_vacio']}")
print(f"[-] Medidores omitidos por ser REPETIDOS y proteger unicidad (Regla 3): {stats['medidores_omitidos_repetido']}")

# Comprobación final del servidor web en tiempo real
t_cli = len(get_all("clientes", "id"))
t_med = len(get_all("medidores", "id"))
print(f"\n=== ESTADO OFICIAL REAL DE TU SISTEMA EN LA NUBE (VERCEL/SUPABASE) ===")
print(f"-> TOTAL CLIENTES DISPONIBLES EN WEB: {t_cli}")
print(f"-> TOTAL MEDIDORES DISPONIBLES EN WEB: {t_med}")
