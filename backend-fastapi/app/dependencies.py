import jwt
from fastapi import Depends, HTTPException, Request, status

from app.security import decodificar_token


def obtener_usuario_actual(request: Request) -> dict:
    """Equivalente a verificarToken.js: exige 'Authorization: Bearer <token>'."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"mensaje": "Token no proporcionado."})

    token = auth_header.split(" ")[1]
    try:
        payload = decodificar_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"mensaje": "Token inválido o expirado."})

    return payload


def requerir_rol(*roles_permitidos: str):
    """Equivalente a verificarRol.js: exige uno de los roles indicados."""

    def dependencia(usuario: dict = Depends(obtener_usuario_actual)) -> dict:
        if usuario.get("rolNombre") not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"mensaje": "No tienes permisos para acceder a este recurso."},
            )
        return usuario

    return dependencia
