from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings

# Costo 10, igual que el backend Node anterior (bcrypt.hash(password, 10)).
# El formato de hash bcrypt es estándar entre lenguajes, así que los usuarios
# que ya existen en la base de datos (creados desde Node) pueden seguir
# iniciando sesión sin volver a registrarse.
_COSTO_BCRYPT = 10


def hash_password(password: str) -> str:
    sal = bcrypt.gensalt(rounds=_COSTO_BCRYPT)
    return bcrypt.hashpw(password.encode("utf-8"), sal).decode("utf-8")


def verificar_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def crear_token(payload: dict) -> str:
    datos = payload.copy()
    expira = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRA_HORAS)
    datos.update({"exp": expira})
    return jwt.encode(datos, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decodificar_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
