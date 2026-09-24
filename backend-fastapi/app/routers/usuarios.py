from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import requerir_rol
from app.models import Rol, Usuario
from app.schemas import MensajeOut, RolOut, UsuarioCrearIn, UsuarioEditarIn, UsuarioEstadoIn, UsuarioListado
from app.security import hash_password

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


def _serializar(u: Usuario) -> dict:
    return {
        "id": u.id,
        "nombre": u.nombre,
        "apellido": u.apellido,
        "tipo_documento": u.tipo_documento,
        "numero_documento": u.numero_documento,
        "direccion": u.direccion,
        "correo": u.correo,
        "telefono": u.telefono,
        "estado": u.estado,
        "rol": u.rol.nombre if u.rol else "",
    }


@router.get("/roles", response_model=List[RolOut])
def listar_roles(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    return db.query(Rol).order_by(Rol.id).all()


@router.get("", response_model=List[UsuarioListado])
def listar_usuarios(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    usuarios = db.query(Usuario).options(joinedload(Usuario.rol)).order_by(Usuario.id).all()
    return [_serializar(u) for u in usuarios]


@router.post("", response_model=UsuarioListado, status_code=201)
def crear_usuario(
    datos: UsuarioCrearIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    """El administrador crea un usuario y le asigna su rol."""
    if db.query(Usuario).filter(Usuario.correo == datos.email).first():
        raise HTTPException(status_code=409, detail={"mensaje": "Este correo ya está registrado."})
    if db.query(Usuario).filter(Usuario.numero_documento == datos.numeroDocumento).first():
        raise HTTPException(status_code=409, detail={"mensaje": "Este número de documento ya está registrado."})
    if not db.get(Rol, datos.rol_id):
        raise HTTPException(status_code=400, detail={"mensaje": "Rol inválido."})

    usuario = Usuario(
        nombre=datos.nombre,
        apellido=datos.apellido,
        tipo_documento=datos.tipoDocumento,
        numero_documento=datos.numeroDocumento,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=datos.email,
        password_hash=hash_password(datos.password),
        rol_id=datos.rol_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return _serializar(usuario)


@router.put("/{usuario_id}", response_model=UsuarioListado)
def editar_usuario(
    usuario_id: int,
    datos: UsuarioEditarIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    """El administrador edita los datos de un usuario y su rol."""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado."})

    # El correo y el documento deben seguir siendo únicos (salvo los del propio usuario).
    choque_correo = (
        db.query(Usuario).filter(Usuario.correo == datos.email, Usuario.id != usuario_id).first()
    )
    if choque_correo:
        raise HTTPException(status_code=409, detail={"mensaje": "Este correo ya está registrado."})
    choque_doc = (
        db.query(Usuario)
        .filter(Usuario.numero_documento == datos.numeroDocumento, Usuario.id != usuario_id)
        .first()
    )
    if choque_doc:
        raise HTTPException(status_code=409, detail={"mensaje": "Este número de documento ya está registrado."})
    if not db.get(Rol, datos.rol_id):
        raise HTTPException(status_code=400, detail={"mensaje": "Rol inválido."})

    usuario.nombre = datos.nombre
    usuario.apellido = datos.apellido
    usuario.tipo_documento = datos.tipoDocumento
    usuario.numero_documento = datos.numeroDocumento
    usuario.direccion = datos.direccion
    usuario.telefono = datos.telefono
    usuario.correo = datos.email
    usuario.rol_id = datos.rol_id
    if datos.password:
        usuario.password_hash = hash_password(datos.password)
    db.commit()
    db.refresh(usuario)
    return _serializar(usuario)


@router.put("/{usuario_id}/estado", response_model=UsuarioListado)
def cambiar_estado_usuario(
    usuario_id: int,
    datos: UsuarioEstadoIn,
    db: Session = Depends(get_db),
    solicitante: dict = Depends(requerir_rol("Administrador")),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail={"mensaje": "Usuario no encontrado."})
    if usuario.id == solicitante["id"]:
        raise HTTPException(status_code=400, detail={"mensaje": "No puedes cambiar tu propio estado."})
    usuario.estado = datos.estado
    db.commit()
    db.refresh(usuario)
    return _serializar(usuario)
