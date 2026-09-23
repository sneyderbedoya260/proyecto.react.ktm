import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Usuario
from app.rate_limit import exigir_limite, ip_cliente, registrar_intento
from app.schemas import LoginIn, MensajeOut, RecuperarIn, RegistroIn, ResetIn, TokenOut, UsuarioOut
from app.security import crear_token, hash_password, verificar_password
from app.utils.mailer import enviar_correo_recuperacion

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

# Hash bcrypt de una contraseña cualquiera. Se verifica contra él cuando el
# correo no existe, para que el login tarde lo mismo exista o no la cuenta y
# nadie deduzca cuáles están registradas midiendo el tiempo de respuesta.
_HASH_SENUELO = hash_password("señuelo-de-tiempo-constante")

# Un login honesto rara vez falla más de un puñado de veces; pasado ese punto es
# fuerza bruta. Registro y recuperación se limitan por IP para que nadie sondee
# muchos correos de corrido (enumeración de usuarios).
LOGIN_MAX_INTENTOS = 8
LOGIN_VENTANA_SEGUNDOS = 15 * 60
IP_MAX_INTENTOS = 20
IP_VENTANA_SEGUNDOS = 60 * 60


@router.post("/register", response_model=MensajeOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: RegistroIn, request: Request, db: Session = Depends(get_db)):
    exigir_limite(
        db, f"registro:{ip_cliente(request)}", limite=IP_MAX_INTENTOS, ventana_segundos=IP_VENTANA_SEGUNDOS
    )
    existente = db.query(Usuario).filter(Usuario.correo == datos.email).first()
    if existente:
        registrar_intento(db, f"registro:{ip_cliente(request)}")
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
def iniciar_sesion(datos: LoginIn, request: Request, db: Session = Depends(get_db)):
    # Se limita por IP y por correo: la IP frena a quien prueba muchas cuentas,
    # el correo frena a quien machaca una sola cuenta desde varias IP.
    clave_ip = f"login:ip:{ip_cliente(request)}"
    clave_correo = f"login:correo:{datos.email.lower()}"
    exigir_limite(db, clave_ip, limite=LOGIN_MAX_INTENTOS * 3, ventana_segundos=LOGIN_VENTANA_SEGUNDOS)
    exigir_limite(db, clave_correo, limite=LOGIN_MAX_INTENTOS, ventana_segundos=LOGIN_VENTANA_SEGUNDOS)

    usuario = db.query(Usuario).filter(Usuario.correo == datos.email).first()
    if not usuario or not verificar_password(datos.password, usuario.password_hash):
        # Un solo mensaje para "no existe" y "clave incorrecta": así nadie
        # distingue qué correos tienen cuenta. Verificamos la contraseña incluso
        # cuando el usuario no existe para no delatar la diferencia por el tiempo
        # de respuesta.
        if not usuario:
            verificar_password(datos.password, _HASH_SENUELO)
        registrar_intento(db, clave_ip)
        registrar_intento(db, clave_correo)
        raise HTTPException(status_code=401, detail={"mensaje": "Credenciales incorrectas."})
    if usuario.estado == "Inactivo":
        raise HTTPException(status_code=403, detail={"mensaje": "Tu cuenta está inactiva. Contacta al administrador."})

    rol_nombre = usuario.rol.nombre
    token = crear_token({"id": usuario.id, "rol_id": usuario.rol_id, "rolNombre": rol_nombre})

    return {
        "token": token,
        "usuario": UsuarioOut(
            id=usuario.id, nombre=usuario.nombre, apellido=usuario.apellido, correo=usuario.correo, rol=rol_nombre
        ),
    }


@router.post("/recover-password", response_model=MensajeOut)
def recuperar_password(datos: RecuperarIn, request: Request, db: Session = Depends(get_db)):
    # Limitar por IP evita que se use este endpoint para inundar de correos a un
    # tercero o para sondear qué correos existen.
    exigir_limite(
        db, f"recuperar:{ip_cliente(request)}", limite=IP_MAX_INTENTOS, ventana_segundos=IP_VENTANA_SEGUNDOS
    )
    registrar_intento(db, f"recuperar:{ip_cliente(request)}")
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
