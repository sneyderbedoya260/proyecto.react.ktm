import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Usuario
from app.schemas import LoginIn, MensajeOut, RecuperarIn, RegistroIn, ResetIn, TokenOut, UsuarioOut
from app.security import crear_token, hash_password, verificar_password
from app.utils.mailer import enviar_correo_recuperacion

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/register", response_model=MensajeOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: RegistroIn, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.correo == datos.email).first()
    if existente:
        raise HTTPException(status_code=409, detail={"mensaje": "Este correo ya está registrado."})

    usuario = Usuario(
        nombre=datos.nombre,
        apellido=datos.apellido,
        tipo_documento=datos.tipoDocumento,
        numero_documento=datos.numeroDocumento,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=datos.email,
        password_hash=hash_password(datos.password),
        rol_id=3,  # Cliente
    )
    db.add(usuario)
    db.commit()
    return {"mensaje": "Registro exitoso."}


@router.post("/login", response_model=TokenOut)
def iniciar_sesion(datos: LoginIn, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.email).first()
    if not usuario:
        raise HTTPException(status_code=401, detail={"mensaje": "Credenciales incorrectas."})
    if usuario.estado == "Inactivo":
        raise HTTPException(status_code=403, detail={"mensaje": "Tu cuenta está inactiva. Contacta al administrador."})
    if not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail={"mensaje": "Credenciales incorrectas."})

    rol_nombre = usuario.rol.nombre
    token = crear_token({"id": usuario.id, "rol_id": usuario.rol_id, "rolNombre": rol_nombre})

    return {
        "token": token,
        "usuario": UsuarioOut(
            id=usuario.id, nombre=usuario.nombre, apellido=usuario.apellido, correo=usuario.correo, rol=rol_nombre
        ),
    }


@router.post("/recover-password", response_model=MensajeOut)
def recuperar_password(datos: RecuperarIn, db: Session = Depends(get_db)):
    try:
        usuario = db.query(Usuario).filter(Usuario.correo == datos.email).first()
        if usuario:
            token = secrets.token_hex(32)
            usuario.reset_token = token
            usuario.reset_token_expira = datetime.utcnow() + timedelta(hours=1)
            db.commit()

            enlace = f"{settings.frontend_url_principal}/restablecer-contrasena?token={token}"
            enviar_correo_recuperacion(datos.email, enlace)

        return {"mensaje": "Si el correo existe, recibirás instrucciones de recuperación."}
    except Exception as error:  # noqa: BLE001
        print("--- ERROR en recuperar_password ---")
        print(repr(error))
        raise HTTPException(status_code=500, detail={"mensaje": "No fue posible procesar la solicitud en este momento."})


@router.post("/reset-password", response_model=MensajeOut)
def restablecer_password(datos: ResetIn, db: Session = Depends(get_db)):
    ahora = datetime.utcnow()
    usuario = (
        db.query(Usuario)
        .filter(Usuario.reset_token == datos.token)
        .filter(Usuario.reset_token_expira > ahora)
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=400, detail={"mensaje": "El enlace es inválido o ya venció. Solicita uno nuevo."})

    usuario.password_hash = hash_password(datos.password)
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}
