"""Límite de intentos apoyado en la base de datos.

En Vercel cada request puede ejecutarse en una instancia distinta, así que un
contador en memoria no sirve: se reiniciaría en cada invocación. Por eso los
intentos se registran en la tabla `intentos_acceso` de Neon, que es compartida.
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.orm import Session


def ip_cliente(request: Request) -> str:
    """IP real del cliente. Detrás del proxy de Vercel llega en X-Forwarded-For."""
    reenviada = request.headers.get("x-forwarded-for")
    if reenviada:
        return reenviada.split(",")[0].strip()
    return request.client.host if request.client else "desconocida"


def _limpiar_viejos(db: Session, ventana_segundos: int) -> None:
    corte = datetime.now(timezone.utc) - timedelta(seconds=ventana_segundos)
    db.execute(text("DELETE FROM intentos_acceso WHERE creado_en < :corte"), {"corte": corte})


def exigir_limite(
    db: Session,
    clave: str,
    *,
    limite: int,
    ventana_segundos: int,
) -> None:
    """Lanza 429 si `clave` superó `limite` intentos en la ventana de tiempo.

    Falla en modo abierto: si la consulta de límite falla (p. ej. la tabla aún
    no existe), deja pasar la petición en vez de bloquear a todos. Un login que
    no se puede usar es peor que un límite que no se aplicó una vez.
    """
    try:
        _limpiar_viejos(db, ventana_segundos)
        corte = datetime.now(timezone.utc) - timedelta(seconds=ventana_segundos)
        total = db.execute(
            text(
                "SELECT COUNT(*) FROM intentos_acceso "
                "WHERE clave = :clave AND creado_en >= :corte"
            ),
            {"clave": clave, "corte": corte},
        ).scalar()
        db.commit()
    except Exception as error:  # noqa: BLE001
        db.rollback()
        print(f"[rate_limit] no se pudo verificar el límite ({clave}): {error!r}")
        return

    if total is not None and total >= limite:
        minutos = max(1, ventana_segundos // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "mensaje": (
                    f"Demasiados intentos. Espera unos {minutos} minuto(s) e inténtalo de nuevo."
                )
            },
        )


def registrar_intento(db: Session, clave: str) -> None:
    """Registra un intento. Se llama tras un intento fallido."""
    try:
        db.execute(text("INSERT INTO intentos_acceso (clave) VALUES (:clave)"), {"clave": clave})
        db.commit()
    except Exception as error:  # noqa: BLE001
        db.rollback()
        print(f"[rate_limit] no se pudo registrar el intento ({clave}): {error!r}")
