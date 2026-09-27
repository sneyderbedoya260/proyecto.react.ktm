"""Migraciones ligeras que el backend aplica solo, de forma idempotente.

Se ejecutan la primera vez que se usa la base en cada proceso. Así el esquema
se mantiene al día sin depender de acceso directo a la base desde otra máquina.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Contenido

_listas = False


def asegurar_migraciones(db: Session) -> None:
    global _listas
    if _listas:
        return
    try:
        bind = db.get_bind()
        dialecto = bind.dialect.name

        # Tabla de contenido del sitio (crea si falta; no toca si ya existe).
        Contenido.__table__.create(bind=bind, checkfirst=True)

        # Columna galeria en productos (lista de URLs de imágenes).
        if dialecto == "postgresql":
            db.execute(text("ALTER TABLE productos ADD COLUMN IF NOT EXISTS galeria JSON DEFAULT '[]'::json"))
            db.commit()
        elif dialecto == "mysql":
            existe = db.execute(
                text(
                    "SELECT COUNT(*) FROM information_schema.columns "
                    "WHERE table_name='productos' AND column_name='galeria'"
                )
            ).scalar()
            if not existe:
                db.execute(text("ALTER TABLE productos ADD COLUMN galeria JSON NULL"))
                db.commit()
        # En SQLite (pruebas) la columna ya viene con create_all, no hace falta ALTER.

        _listas = True
    except Exception as error:  # noqa: BLE001
        db.rollback()
        print(f"[migraciones] no se pudo aplicar: {error!r}")
