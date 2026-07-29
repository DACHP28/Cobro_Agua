import urllib.request
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

def delete_all(table):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=gt.0"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            print(f"[OK] Tabla '{table}' limpiada (cero registros).")
    except Exception as e:
        print(f"[Aviso] Error al limpiar {table}: {e}")

print("=== LIMPIEZA FINAL DE DATOS DE PRUEBA ===")
delete_all('pagos_multas')
delete_all('pagos_servicio')
delete_all('multas')
delete_all('cobros')
delete_all('consumos')

print("\n¡Listo! Tu base de datos quedó en cero en todas sus transacciones ficticias. Tus clientes y medidores se mantienen intactos listos para producción oficial.")
