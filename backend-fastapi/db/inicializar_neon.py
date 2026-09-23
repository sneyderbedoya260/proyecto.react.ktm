"""Crea el esquema y los datos iniciales de la base en Neon.

Uso:
    set DATABASE_URL=postgresql://...        (Windows)
    export DATABASE_URL=postgresql://...     (Mac/Linux)
    python db/inicializar_neon.py [--admin-password CLAVE]

Es idempotente: se puede correr varias veces sin duplicar nada.
"""

import argparse
import os
import secrets
import sys
from pathlib import Path

import bcrypt
import psycopg

AQUI = Path(__file__).resolve().parent
ARCHIVO_ESQUEMA = AQUI / "schema_neon.sql"

ADMIN_CORREO = "admin@ktm.com"

# El catálogo inicial. Las imágenes se sirven desde public/images/ del frontend,
# por eso las rutas son relativas a la raíz del sitio.
PRODUCTOS = [
    ("KTM 1390 Super Adventure", "La motocicleta ideal para la aventura.",
     "Motor de 1350 cc, 173 hp y 145 Nm de torque. Suspensión semiactiva y modos de conducción.",
     "adventure", "/images/moto-1.png", 98000000),
    ("KTM 990 Duke", "Potencia y estilo urbano.",
     "Bicilíndrica de 947 cc con 123 hp. La naked de media cilindrada más agresiva de la gama.",
     "naked", "/images/moto2.jpg", 72000000),
    ("KTM 690 SMC R", "Supermoto de calle y pista.",
     "Monocilíndrica LC4 de 693 cc, 74 hp y solo 147 kg. Chasis diseñado para el asfalto técnico.",
     "supermoto", "/images/moto3.jpg", 58000000),
    ("KTM 890 Adventure R", "Lista para cualquier terreno.",
     "889 cc, 105 hp, suspensión WP XPLOR de 240 mm y llanta delantera de 21 pulgadas.",
     "adventure", "/images/moto4.jpg", 79000000),
    ("KTM 690 Enduro R", "Aventura sin límites.",
     "Enduro homologada para calle con motor LC4 de 693 cc y 74 hp. Peso en seco de 146 kg.",
     "enduro", "/images/moto5.jpg", 56000000),
    ("KTM 890 SMT", "Sport touring de verdad.",
     "889 cc y 105 hp con ergonomía de viaje, maletas opcionales y electrónica completa.",
     "sport touring", "/images/moto6.jpg", 76000000),
    ("KTM 390 Adventure R", "Tu primera gran aventura.",
     "399 cc, 45 hp, control de tracción desconectable y ABS off-road. Ideal para empezar.",
     "adventure", "/images/moto7.jpg", 32000000),
    ("KTM 390 SMC R", "Supermoto ligera y divertida.",
     "Monocilíndrica de 399 cc con 45 hp y 177 kg. Perfecta para ciudad y curvas.",
     "supermoto", "/images/moto8.jpg", 30000000),
    ("KTM 990 RC R", "Deportiva de calle con alma de pista.",
     "947 cc, 128 hp, aerodinámica activa y posición de conducción totalmente deportiva.",
     "sport", "/images/moto9.jpg", 85000000),
    ("KTM 390 Enduro R", "Pura diversión todo terreno.",
     "399 cc y 45 hp en un chasis enduro con suspensión de 230 mm de recorrido.",
     "enduro", "/images/moto10.png", 31000000),
]


def sentencias(sql: str):
    """Parte el archivo .sql en sentencias. No hay funciones ni $$ en el esquema."""
    for bruta in sql.split(";"):
        limpia = "\n".join(
            linea for linea in bruta.splitlines() if not linea.strip().startswith("--")
        ).strip()
        if limpia:
            yield limpia


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--admin-password", default=None)
    args = parser.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: falta la variable de entorno DATABASE_URL.", file=sys.stderr)
        return 1

    admin_password = args.admin_password or secrets.token_urlsafe(9)
    generada = args.admin_password is None

    with psycopg.connect(url) as conexion:
        with conexion.cursor() as cur:
            print("Creando esquema...")
            for sentencia in sentencias(ARCHIVO_ESQUEMA.read_text(encoding="utf-8")):
                cur.execute(sentencia)

            cur.execute("SELECT id FROM roles WHERE nombre = 'Administrador'")
            rol_admin = cur.fetchone()[0]

            cur.execute("SELECT id FROM usuarios WHERE correo = %s", (ADMIN_CORREO,))
            existente = cur.fetchone()
            if existente:
                print(f"El usuario {ADMIN_CORREO} ya existe; no se toca su contraseña.")
                admin_password = None
            else:
                hash_ = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt(rounds=10)).decode()
                cur.execute(
                    """
                    INSERT INTO usuarios
                        (nombre, apellido, tipo_documento, numero_documento, direccion,
                         telefono, correo, password_hash, estado, rol_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Activo', %s)
                    """,
                    ("Administrador", "KTM", "CC", "1000000000", "Sede principal",
                     "3000000000", ADMIN_CORREO, hash_, rol_admin),
                )
                print(f"Usuario administrador creado: {ADMIN_CORREO}")

            cur.execute("SELECT COUNT(*) FROM productos")
            if cur.fetchone()[0] == 0:
                cur.executemany(
                    """
                    INSERT INTO productos
                        (titulo, descripcion, detalle, categoria, imagen_url, precio, estado)
                    VALUES (%s, %s, %s, %s, %s, %s, 'Disponible')
                    """,
                    PRODUCTOS,
                )
                print(f"{len(PRODUCTOS)} productos insertados.")
            else:
                print("Ya hay productos en la base; no se insertó el catálogo inicial.")

        conexion.commit()

        with conexion.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM usuarios")
            usuarios = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM productos")
            productos = cur.fetchone()[0]

    print("\nListo.")
    print(f"  usuarios: {usuarios}")
    print(f"  productos: {productos}")
    if admin_password:
        print(f"\n  Correo:     {ADMIN_CORREO}")
        print(f"  Contraseña: {admin_password}")
        if generada:
            print("  (generada al azar: cámbiala después de iniciar sesión)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
