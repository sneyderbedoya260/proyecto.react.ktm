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
# VENTAS / COTIZACIONES  (REQ-01, REQ-02, REQ-03)
# --------------------------------------------------------------------------- #
class ItemVentaIn(BaseModel):
    producto_id: int
    cantidad: int = Field(default=1, ge=1)


class VentaCreateIn(BaseModel):
    items: List[ItemVentaIn] = Field(min_length=1)
    descuento: Decimal = Decimal("0")
    notas: Optional[str] = None
    cliente_id: Optional[int] = None  # solo Admin/Empleado puede fijarlo explícitamente


class DetalleVentaOut(BaseModel):
    id: int
    producto_id: int
    producto_titulo: Optional[str] = None
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class VentaOut(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: Optional[str] = None
    usuario_operador_id: Optional[int] = None
    fecha_hora: datetime
    subtotal: Decimal
    descuento: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    notas: Optional[str] = None
    detalles: List[DetalleVentaOut] = []

    model_config = {"from_attributes": True}


class VentaEstadoIn(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        permitidos = {"Pendiente", "Cotizado", "Confirmado", "Cancelado"}
        if v not in permitidos:
            raise ValueError(f"Estado inválido. Debe ser uno de: {', '.join(permitidos)}")
        return v


# --------------------------------------------------------------------------- #
# FACTURAS  (REQ-07, REQ-08, REQ-09)
# --------------------------------------------------------------------------- #
class DetalleFacturaOut(BaseModel):
    id: int
    producto_id: int
    descripcion: str
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


class FacturaOut(BaseModel):
    id: int
    venta_id: int
    numero_factura: str
    cliente_id: int
    cliente_nombre: Optional[str] = None
    fecha: datetime
    subtotal: Decimal
    descuento: Decimal
    impuestos: Decimal
    total: Decimal
    estado: str
    detalles: List[DetalleFacturaOut] = []

    model_config = {"from_attributes": True}


# --------------------------------------------------------------------------- #
# REPORTES  (REQ-04, REQ-05, REQ-06)
# --------------------------------------------------------------------------- #
class ReporteVentaItem(BaseModel):
    numero_venta: int
    fecha_hora: datetime
    cliente: str
    productos: str
    cantidad_total: int
    total: Decimal
    estado: str


class ReporteDiarioOut(BaseModel):
    fecha: str
    total_solicitudes: int
    total_unidades: int
    total_recaudado: Decimal
    ventas: List[ReporteVentaItem]
