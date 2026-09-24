from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# --------------------------------------------------------------------------- #
# AUTENTICACIÓN Y USUARIOS
# --------------------------------------------------------------------------- #
class RegistroIn(BaseModel):
    nombre: str
    apellido: str
    tipoDocumento: str
    numeroDocumento: str
    direccion: str
    telefono: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=20)

    @field_validator("numeroDocumento")
    @classmethod
    def validar_documento(cls, v):
        if not v.isdigit() or not (6 <= len(v) <= 12):
            raise ValueError("Número de documento inválido.")
        return v

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v):
        if not v.isdigit() or not (7 <= len(v) <= 10):
            raise ValueError("Teléfono inválido.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: str
    rol: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    token: str
    usuario: UsuarioOut


class MensajeOut(BaseModel):
    mensaje: str


class RecuperarIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=20)


class UsuarioListado(BaseModel):
    id: int
    nombre: str
    apellido: str
    tipo_documento: str = ""
    numero_documento: str = ""
    direccion: str = ""
    correo: str
    telefono: str
    estado: str
    rol: str

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# PRODUCTOS
# --------------------------------------------------------------------------- #
class ProductoIn(BaseModel):
    titulo: str
    descripcion: str
    detalle: str
    categoria: str
    imagen_url: str
    precio: Decimal = Decimal("0")
    estado: Optional[str] = "Disponible"


class ProductoOut(BaseModel):
    id: int
    titulo: str
    descripcion: str
    detalle: str
    categoria: str
    imagen_url: str
    precio: Decimal
    estado: str

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# GESTIÓN DE USUARIOS (panel de administración)
# --------------------------------------------------------------------------- #
class UsuarioCrearIn(BaseModel):
    nombre: str
    apellido: str
    tipoDocumento: str
    numeroDocumento: str
    direccion: str
    telefono: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=20)
    rol_id: int = Field(ge=1, le=3)  # 1 Administrador, 2 Empleado, 3 Cliente


class UsuarioEditarIn(BaseModel):
    nombre: str
    apellido: str
    tipoDocumento: str
    numeroDocumento: str
    direccion: str
    telefono: str
    email: EmailStr
    rol_id: int = Field(ge=1, le=3)
    # Opcional: si viene vacío/None, no se cambia la contraseña.
    password: Optional[str] = Field(default=None, min_length=8, max_length=20)


class UsuarioEstadoIn(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        if v not in {"Activo", "Inactivo"}:
            raise ValueError("Estado inválido. Debe ser 'Activo' o 'Inactivo'.")
        return v


class RolOut(BaseModel):
    id: int
    nombre: str

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# PQR  (Peticiones, Quejas y Reclamos)  — REQ-16
# --------------------------------------------------------------------------- #
class PQRCreateIn(BaseModel):
    tipo: str
    asunto: str = Field(min_length=3, max_length=150)
    mensaje: str = Field(min_length=5)

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v):
        if v not in {"Peticion", "Queja", "Reclamo"}:
            raise ValueError("Tipo inválido. Debe ser Peticion, Queja o Reclamo.")
        return v


class PQRRespuestaIn(BaseModel):
    estado: str
    respuesta: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        permitidos = {"Pendiente", "En proceso", "Respondida", "Cerrada"}
        if v not in permitidos:
            raise ValueError(f"Estado inválido. Debe ser uno de: {', '.join(permitidos)}")
        return v


class PQROut(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: Optional[str] = None
    tipo: str
    asunto: str
    mensaje: str
    estado: str
    respuesta: Optional[str] = None
    creado_en: datetime
    actualizado_en: datetime

    model_config = {"from_attributes": True}
