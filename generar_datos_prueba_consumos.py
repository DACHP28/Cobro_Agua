import urllib.request
import urllib.parse
import json
import ssl
import sys
import io
from datetime import datetime, timedelta

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

def get_records(table, query="select=*"):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{query}"
    req = urllib.request.Request(url, headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error reading {table}: {e}")
        return []

def delete_all(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=gt.0"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            pass
    except Exception as e:
        print(f"Aviso al limpiar {table}: {e}")

def post_record(table, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS)
    with urllib.request.urlopen(req, context=ssl_context) as resp:
        return json.loads(resp.read().decode('utf-8'))[0]

def patch_record(table, rec_id, payload):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{rec_id}"
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='PATCH')
    with urllib.request.urlopen(req, context=ssl_context) as resp:
        return resp.status

print("=== 1. LIMPIANDO PRUEBAS ANTERIORES EN CONSUMOS, COBROS Y MULTAS ===")
delete_all('pagos_multas')
delete_all('pagos_servicio')
delete_all('multas')
delete_all('cobros')
delete_all('consumos')
print("[OK] Tablas de transacciones en cero. Medidores y Clientes intactos.")

print("\n=== 2. SELECCIONANDO MEDIDORES PARA REPRESENTAR TODAS LAS CATEGORIAS ===")
medidores = get_records("medidores", "select=id,numero,cliente_id,clientes(nombre,apellido)&limit=6")
if not medidores or len(medidores) < 3:
    print("[ERROR] No se encontraron suficientes medidores activos.")
    sys.exit(1)

categorias = ["Domestico", "Comercial", "Industrial", "Riego", "Publico", "Comunitario"]

for idx, m in enumerate(medidores):
    cat = categorias[idx % len(categorias)]
    patch_record("medidores", m["id"], {"tipo_servicio": cat})
    cli_nom = m.get("clientes", {}).get("nombre", "Cliente") if m.get("clientes") else f"Cliente ID #{m['cliente_id']}"
    print(f"  -> Medidor [{m['numero']}] ({cli_nom}): Asignada categoría '{cat}'")

print("\n=== 3. INYECTANDO HISTORIAL DE LECTURAS, EXCEDENTES Y FACTURAS (MARZO - JULIO 2026) ===")

now = datetime.now()

# CASO 1: MEDIDOR DOMESTICO (Con meses con atraso grave para probar multas + lectura reciente con excedente)
m_dom = medidores[0]
print(f"\n[*] Generando Caso 1 [DOMESTICO] para medidor #{m_dom['numero']}:")
# Marzo (hace ~120 días - Moroso 4 meses de atraso)
c_mar = post_record("consumos", {
    "medidor_id": m_dom["id"], "mes_anio": "Marzo 2026", "lectura_anterior": 100, "lectura_actual": 118,
    "consumo_calculado": 18, "estado": "facturado", "fecha_lectura": (now - timedelta(days=120)).isoformat(),
    "observaciones": "DATOS_PRUEBA - Excedente 3m3"
})
cobro_mar = post_record("cobros", {
    "consumo_id": c_mar["id"], "cliente_id": m_dom["cliente_id"], "monto_subtotal": 4.50, "impuestos": 0,
    "monto_total": 4.50, "estado": "pendiente", "fecha_emision": (now - timedelta(days=120)).isoformat()
})
print("  [+] Marzo 2026 (18 m³ - $4.50) -> Factura emitada HACE 4 MESES en estado PENDIENTE (Generará multa en auditoría).")

# Abril (hace ~90 días - Moroso 3 meses de atraso)
c_abr = post_record("consumos", {
    "medidor_id": m_dom["id"], "mes_anio": "Abril 2026", "lectura_anterior": 118, "lectura_actual": 140,
    "consumo_calculado": 22, "estado": "facturado", "fecha_lectura": (now - timedelta(days=90)).isoformat(),
    "observaciones": "DATOS_PRUEBA - Excedente 7m3"
})
cobro_abr = post_record("cobros", {
    "consumo_id": c_abr["id"], "cliente_id": m_dom["cliente_id"], "monto_subtotal": 6.50, "impuestos": 0,
    "monto_total": 6.50, "estado": "pendiente", "fecha_emision": (now - timedelta(days=90)).isoformat()
})
print("  [+] Abril 2026 (22 m³ - $6.50) -> Factura emitida HACE 3 MESES en estado PENDIENTE (Generará multa en auditoría).")

# Julio (Actual - Pendiente de emitir en ventanilla)
c_jul_dom = post_record("consumos", {
    "medidor_id": m_dom["id"], "mes_anio": "Julio 2026", "lectura_anterior": 140, "lectura_actual": 162,
    "consumo_calculado": 22, "estado": "registrado", "fecha_lectura": now.isoformat(),
    "observaciones": "DATOS_PRUEBA - Listo para facturar en ventanilla con excedente (+7 m³)"
})
print("  [+] Julio 2026 (22 m³) -> Estado REGISTRADO (Listo para que lo factures con un clic en la pestaña Cobros).")


# CASO 2: MEDIDOR COMERCIAL (Tarifa base $7, excedente $0.80)
if len(medidores) > 1:
    m_com = medidores[1]
    print(f"\n[*] Generando Caso 2 [COMERCIAL] para medidor #{m_com['numero']}:")
    # Mayo (Pagado exitoso)
    c_may = post_record("consumos", {
        "medidor_id": m_com["id"], "mes_anio": "Mayo 2026", "lectura_anterior": 400, "lectura_actual": 420,
        "consumo_calculado": 20, "estado": "facturado", "fecha_lectura": (now - timedelta(days=60)).isoformat(),
        "observaciones": "DATOS_PRUEBA - En rango"
    })
    post_record("cobros", {
        "consumo_id": c_may["id"], "cliente_id": m_com["cliente_id"], "monto_subtotal": 7.00, "impuestos": 0,
        "monto_total": 7.00, "estado": "pagado", "fecha_emision": (now - timedelta(days=60)).isoformat(),
        "fecha_pago": (now - timedelta(days=55)).isoformat(), "metodo_pago": "Efectivo", "referencia_pago": "Ventanilla"
    })
    print("  [+] Mayo 2026 (20 m³ - $7.00) -> Facturado y PAGADO en efectivo.")

    # Julio (Actual - con alto excedente comercial: 38m3 = +13m3 extra)
    post_record("consumos", {
        "medidor_id": m_com["id"], "mes_anio": "Julio 2026", "lectura_anterior": 420, "lectura_actual": 458,
        "consumo_calculado": 38, "estado": "registrado", "fecha_lectura": now.isoformat(),
        "observaciones": "DATOS_PRUEBA - Alto excedente comercial (+13 m³ extra)"
    })
    print("  [+] Julio 2026 (38 m³) -> Estado REGISTRADO (Listo para facturar en ventanilla con recargo comercial).")


# CASO 3: MEDIDOR INDUSTRIAL (Tarifa base $15, excedente $1.20)
if len(medidores) > 2:
    m_ind = medidores[2]
    print(f"\n[*] Generando Caso 3 [INDUSTRIAL] para medidor #{m_ind['numero']}:")
    # Abril (Moroso industrial hace 3.5 meses)
    c_abr_ind = post_record("consumos", {
        "medidor_id": m_ind["id"], "mes_anio": "Abril 2026", "lectura_anterior": 1000, "lectura_actual": 1070,
        "consumo_calculado": 70, "estado": "facturado", "fecha_lectura": (now - timedelta(days=105)).isoformat(),
        "observaciones": "DATOS_PRUEBA - Sobreconsumo industrial (+20 m³ extra)"
    })
    post_record("cobros", {
        "consumo_id": c_abr_ind["id"], "cliente_id": m_ind["cliente_id"], "monto_subtotal": 39.00, "impuestos": 0,
        "monto_total": 39.00, "estado": "pendiente", "fecha_emision": (now - timedelta(days=105)).isoformat()
    })
    print("  [+] Abril 2026 (70 m³ - $39.00) -> Factura PENDIENTE (Moroso con más de 3 meses de atraso).")


# CASO 4: MEDIDOR RIEGO (Tarifa base $2.50, tolerancia de fecha reciente)
if len(medidores) > 3:
    m_rgo = medidores[3]
    print(f"\n[*] Generando Caso 4 [RIEGO / AGRICOLA] para medidor #{m_rgo['numero']}:")
    c_jun = post_record("consumos", {
        "medidor_id": m_rgo["id"], "mes_anio": "Junio 2026", "lectura_anterior": 200, "lectura_actual": 245,
        "consumo_calculado": 45, "estado": "facturado", "fecha_lectura": (now - timedelta(days=25)).isoformat(),
        "observaciones": "DATOS_PRUEBA - Consumo de riego (+15 m³ extra)"
    })
    post_record("cobros", {
        "consumo_id": c_jun["id"], "cliente_id": m_rgo["cliente_id"], "monto_subtotal": 8.50, "impuestos": 0,
        "monto_total": 8.50, "estado": "pendiente", "fecha_emision": (now - timedelta(days=25)).isoformat()
    })
    print("  [+] Junio 2026 (45 m³ - $8.50) -> Emitido HACE 25 DÍAS (Pendiente, NO generará multa aún por estar dentro del margen de 2 meses).")


# CASO 5: MEDIDOR PUBLICO / INSTITUCIONAL
if len(medidores) > 4:
    m_pub = medidores[4]
    print(f"\n[*] Generando Caso 5 [PUBLICO / INSTITUCIONAL] para medidor #{m_pub['numero']}:")
    post_record("consumos", {
        "medidor_id": m_pub["id"], "mes_anio": "Julio 2026", "lectura_anterior": 80, "lectura_actual": 95,
        "consumo_calculado": 15, "estado": "registrado", "fecha_lectura": now.isoformat(),
        "observaciones": "DATOS_PRUEBA - En rango institucional"
    })
    print("  [+] Julio 2026 (15 m³) -> Estado REGISTRADO (En rango sin recargo).")

print("\n=== ¡SIMULACION GENERADA EXITOSAMENTE INYECTADA A VERCEL / SUPABASE! ===")
print("Ya puedes entrar al navegador para verificar Consumos, Cobros y ejecutar la auditoría de Multas por Atraso.")
