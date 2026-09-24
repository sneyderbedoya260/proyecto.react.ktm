"""Pruebas automatizadas (Pytest + TestClient) del backend FastAPI.

Cubren el CRUD de productos, la autenticación con JWT, la seguridad por roles,
el flujo de ventas/facturas/reportes, los dashboards, el chatbot y el límite de
intentos. Se ejecutan contra una base SQLite en memoria (no toca producción):

    cd backend-fastapi
    venv/Scripts/python -m pytest -v
"""
import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Producto, Rol, Usuario
from app.security import hash_password

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(scope="module", autouse=True)
def preparar_base():
    """Crea el esquema y los datos base una vez para todo el módulo."""
    Base.metadata.create_all(bind=engine)
    # intentos_acceso no es un modelo ORM (se maneja con SQL crudo), se crea aquí.
    with engine.begin() as con:
        con.execute(text(
            "CREATE TABLE IF NOT EXISTS intentos_acceso ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, clave VARCHAR(200) NOT NULL, "
            "creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)"
        ))
    with TestingSessionLocal() as db:
        db.add_all([Rol(nombre="Administrador"), Rol(nombre="Empleado"), Rol(nombre="Cliente")])
        db.commit()
        db.add(Usuario(
            nombre="Admin", apellido="KTM", tipo_documento="CC", numero_documento="1000000000",
            direccion="Calle 1", telefono="3000000000", correo="admin@ktm.com",
            password_hash=hash_password("Admin1234"), rol_id=1,
        ))
        db.add(Producto(
            titulo="KTM 390 Duke", descripcion="Naked deportiva", detalle="Detalle largo",
            categoria="Naked", imagen_url="/images/moto-1.png", precio=25000000,
        ))
        db.commit()
    yield


client = TestClient(app)


def _token(correo, password):
    r = client.post("/api/auth/login", json={"email": correo, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def _headers(correo, password):
    return {"Authorization": f"Bearer {_token(correo, password)}"}


# --------------------------------------------------------------------------- #
# Salud y documentación
# --------------------------------------------------------------------------- #
def test_salud():
    r = client.get("/api/salud")
    assert r.status_code == 200
    assert r.json()["estado"] == "ok"


def test_documentacion_disponible():
    assert client.get("/openapi.json").status_code == 200


# --------------------------------------------------------------------------- #
# Autenticación (JWT) y seguridad
# --------------------------------------------------------------------------- #
def test_registro_cliente():
    r = client.post("/api/auth/register", json={
        "nombre": "Jostin", "apellido": "Perez", "tipoDocumento": "CC",
        "numeroDocumento": "123456789", "direccion": "Calle 2", "telefono": "3001234567",
        "email": "cliente@test.com", "password": "Cliente123",
    })
    assert r.status_code == 201, r.text


def test_login_correcto_devuelve_token():
    r = client.post("/api/auth/login", json={"email": "admin@ktm.com", "password": "Admin1234"})
    assert r.status_code == 200
    assert "token" in r.json()
    assert r.json()["usuario"]["rol"] == "Administrador"


def test_login_credenciales_incorrectas():
    r = client.post("/api/auth/login", json={"email": "admin@ktm.com", "password": "malaclave"})
    assert r.status_code == 401


def test_correo_inexistente_mismo_mensaje():
    # No debe delatar si el correo existe: mismo mensaje que una clave mala.
    r = client.post("/api/auth/login", json={"email": "nadie@x.com", "password": "loquesea1"})
    assert r.status_code == 401
    assert r.json()["detail"]["mensaje"] == "Credenciales incorrectas."


def test_endpoint_protegido_sin_token():
    assert client.get("/api/dashboard/resumen").status_code == 401


# --------------------------------------------------------------------------- #
# CRUD de productos (recurso principal del dominio)
# --------------------------------------------------------------------------- #
def test_listar_productos_publico():
    r = client.get("/api/productos")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_crud_producto_completo_como_admin():
    h = _headers("admin@ktm.com", "Admin1234")
    nuevo = {
        "titulo": "KTM 890 Adventure", "descripcion": "Trail media", "detalle": "Detalle",
        "categoria": "adventure", "imagen_url": "/images/moto4.jpg", "precio": 79000000,
        "estado": "Disponible",
    }
    # Crear
    r = client.post("/api/productos", json=nuevo, headers=h)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    # Consultar
    assert client.get(f"/api/productos/{pid}").json()["titulo"] == "KTM 890 Adventure"
    # Actualizar
    nuevo["precio"] = 80000000
    r = client.put(f"/api/productos/{pid}", json=nuevo, headers=h)
    assert r.status_code == 200
    assert float(r.json()["precio"]) == 80000000
    # Eliminar
    assert client.delete(f"/api/productos/{pid}", headers=h).status_code == 200
    assert client.get(f"/api/productos/{pid}").status_code == 404


def test_cliente_no_puede_crear_producto():
    h = _headers("cliente@test.com", "Cliente123")
    r = client.post("/api/productos", json={
        "titulo": "X", "descripcion": "Y", "detalle": "Z", "categoria": "naked",
        "imagen_url": "/x.png", "precio": 1, "estado": "Disponible",
    }, headers=h)
    assert r.status_code == 403


# --------------------------------------------------------------------------- #
# Ventas, facturas y reportes
# --------------------------------------------------------------------------- #
def test_flujo_venta_factura_reportes():
    hc = _headers("cliente@test.com", "Cliente123")
    ha = _headers("admin@ktm.com", "Admin1234")

    venta = client.post("/api/ventas", json={"items": [{"producto_id": 1, "cantidad": 2}],
                                             "notas": "Interesado"}, headers=hc)
    assert venta.status_code == 201, venta.text
    vid = venta.json()["id"]
    assert float(venta.json()["total"]) > 0  # calcula subtotal/impuestos/total

    # El cliente solo ve sus ventas; el admin las ve todas.
    assert client.get("/api/ventas", headers=hc).status_code == 200
    assert client.get("/api/ventas", headers=ha).status_code == 200

    factura = client.post(f"/api/facturas/generar/{vid}", headers=ha)
    assert factura.status_code == 201, factura.text
    fid = factura.json()["id"]

    pdf = client.get(f"/api/facturas/{fid}/descargar", headers=ha)
    assert pdf.status_code == 200 and len(pdf.content) > 500  # es un PDF real

    hoy = datetime.date.today().isoformat()
    assert client.get(f"/api/reportes/ventas-diario?fecha={hoy}", headers=ha).status_code == 200
    assert len(client.get(f"/api/reportes/ventas-diario/pdf?fecha={hoy}", headers=ha).content) > 500
    assert len(client.get(f"/api/reportes/ventas-diario/excel?fecha={hoy}", headers=ha).content) > 500


def test_cliente_no_puede_generar_factura():
    hc = _headers("cliente@test.com", "Cliente123")
    assert client.post("/api/facturas/generar/1", headers=hc).status_code == 403


# --------------------------------------------------------------------------- #
# Dashboards
# --------------------------------------------------------------------------- #
def test_dashboard_resumen_y_roles():
    ha = _headers("admin@ktm.com", "Admin1234")
    hc = _headers("cliente@test.com", "Cliente123")
    r = client.get("/api/dashboard/resumen", headers=ha)
    assert r.status_code == 200
    assert "total_productos" in r.json()
    # Un cliente no puede ver el dashboard.
    assert client.get("/api/dashboard/resumen", headers=hc).status_code == 403


def test_dashboard_catalogo():
    ha = _headers("admin@ktm.com", "Admin1234")
    r = client.get("/api/dashboard/catalogo?agrupacion=dia", headers=ha)
    assert r.status_code == 200
    assert "por_categoria" in r.json()


# --------------------------------------------------------------------------- #
# Chatbot IA (sin clave configurada responde con gracia, no 500)
# --------------------------------------------------------------------------- #
def test_chatbot_responde():
    r = client.post("/api/chatbot", json={"mensaje": "hola", "historial": []})
    assert r.status_code == 200
    assert "respuesta" in r.json()


# --------------------------------------------------------------------------- #
# Límite de intentos (fuerza bruta)
# --------------------------------------------------------------------------- #
def test_limite_de_intentos_login():
    # Muchos intentos fallidos sobre el mismo correo deben terminar en 429.
    codigos = []
    for i in range(12):
        r = client.post("/api/auth/login",
                        json={"email": "brute@test.com", "password": f"mala{i}"},
                        headers={"X-Forwarded-For": "9.9.9.9"})
        codigos.append(r.status_code)
    assert 429 in codigos, f"nunca se activó el límite: {codigos}"
