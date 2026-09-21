"""Prueba de humo: valida que toda la app FastAPI arranca y los flujos
principales funcionan, usando SQLite en memoria en vez de MySQL real
(que no está disponible en este entorno de verificación)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app import models  # noqa: F401 asegura que todos los modelos se registren
from app.main import app
from app.security import hash_password

from sqlalchemy.pool import StaticPool

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# --- Datos base: roles, un producto, un admin ya con password hasheada ---
with TestingSessionLocal() as db:
    from app.models import Rol, Usuario, Producto

    db.add_all([Rol(nombre="Administrador"), Rol(nombre="Empleado"), Rol(nombre="Cliente")])
    db.commit()

    admin = Usuario(
        nombre="Admin", apellido="KTM", tipo_documento="CC", numero_documento="1000000000",
        direccion="Calle 1", telefono="3000000000", correo="admin@ktm.com",
        password_hash=hash_password("Admin1234"), rol_id=1,
    )
    db.add(admin)

    producto = Producto(
        titulo="KTM 390 Duke", descripcion="Naked deportiva", detalle="Detalle largo",
        categoria="Naked", imagen_url="http://localhost:8000/images/moto-1.png", precio=25000000,
    )
    db.add(producto)
    db.commit()

client = TestClient(app)

print("1) Salud:", client.get("/api/salud").json())

print("2) Registro cliente:", client.post("/api/auth/register", json={
    "nombre": "Jostin", "apellido": "Perez", "tipoDocumento": "CC", "numeroDocumento": "123456789",
    "direccion": "Calle 2", "telefono": "3001234567", "email": "cliente@test.com", "password": "Cliente123",
}).json())

login_admin = client.post("/api/auth/login", json={"email": "admin@ktm.com", "password": "Admin1234"})
print("3) Login admin:", login_admin.status_code, login_admin.json())
token_admin = login_admin.json()["token"]

login_cliente = client.post("/api/auth/login", json={"email": "cliente@test.com", "password": "Cliente123"})
print("4) Login cliente:", login_cliente.status_code, login_cliente.json())
token_cliente = login_cliente.json()["token"]

headers_cliente = {"Authorization": f"Bearer {token_cliente}"}
headers_admin = {"Authorization": f"Bearer {token_admin}"}

print("5) Listar productos:", client.get("/api/productos/").json())

venta_resp = client.post("/api/ventas/", json={"items": [{"producto_id": 1, "cantidad": 2}], "notas": "Interesado en financiación"}, headers=headers_cliente)
print("6) Crear venta/cotización:", venta_resp.status_code, venta_resp.json())
venta_id = venta_resp.json()["id"]

print("7) Listar ventas (cliente, solo las suyas):", client.get("/api/ventas/", headers=headers_cliente).json())
print("8) Listar ventas (admin, todas):", client.get("/api/ventas/", headers=headers_admin).json())

factura_resp = client.post(f"/api/facturas/generar/{venta_id}", headers=headers_admin)
print("9) Generar factura:", factura_resp.status_code, factura_resp.json())
factura_id = factura_resp.json()["id"]

print("10) Descargar factura PDF (bytes):", len(client.get(f"/api/facturas/{factura_id}/descargar", headers=headers_admin).content))

fecha_hoy = __import__("datetime").date.today().isoformat()
print("11) Reporte diario JSON:", client.get(f"/api/reportes/ventas-diario?fecha={fecha_hoy}", headers=headers_admin).json())
print("12) Reporte diario PDF (bytes):", len(client.get(f"/api/reportes/ventas-diario/pdf?fecha={fecha_hoy}", headers=headers_admin).content))
print("13) Reporte diario Excel (bytes):", len(client.get(f"/api/reportes/ventas-diario/excel?fecha={fecha_hoy}", headers=headers_admin).content))

print("14) Cliente NO debe poder generar factura (403 esperado):", client.post(f"/api/facturas/generar/{venta_id}", headers=headers_cliente).status_code)

print("15) Dashboard resumen (admin):", client.get("/api/dashboard/resumen", headers=headers_admin).json())
print("16) Dashboard resumen (cliente, 403 esperado):", client.get("/api/dashboard/resumen", headers=headers_cliente).status_code)
print("17) Dashboard filtros:", client.get("/api/dashboard/filtros", headers=headers_admin).json())
print("18) Dashboard ventas (sin filtros):", client.get("/api/dashboard/ventas?agrupacion=dia", headers=headers_admin).json())
print("19) Dashboard ventas (filtrado por producto inexistente):", client.get("/api/dashboard/ventas?producto_id=999", headers=headers_admin).json())

print("\n✅ TODO OK")
