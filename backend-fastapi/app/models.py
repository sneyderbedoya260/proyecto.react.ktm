from sqlalchemy import (
    DECIMAL,
    TIMESTAMP,
    Column,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(30), unique=True, nullable=False)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(80), nullable=False)
    apellido = Column(String(80), nullable=False)
    tipo_documento = Column(String(10), nullable=False)
    numero_documento = Column(String(12), unique=True, nullable=False)
    direccion = Column(String(180), nullable=False)
    telefono = Column(String(10), nullable=False)
    correo = Column(String(160), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    estado = Column(Enum("Activo", "Inactivo", name="estado_usuario"), nullable=False, default="Activo")
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    reset_token = Column(String(255), nullable=True)
    reset_token_expira = Column(TIMESTAMP, nullable=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    rol = relationship("Rol")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(140), nullable=False)
    descripcion = Column(String(255), nullable=False)
    detalle = Column(Text, nullable=False)
    categoria = Column(String(60), nullable=False)
    imagen_url = Column(String(500), nullable=False)
    precio = Column(DECIMAL(12, 2), nullable=False, default=0)
    estado = Column(
        Enum("Disponible", "Agotado", "Inactivo", name="estado_producto"),
        nullable=False,
        default="Disponible",
    )
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Venta(Base):
    """'Venta' = solicitud de interés/cotización sobre uno o varios modelos."""

    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario_operador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_hora = Column(TIMESTAMP, server_default=func.now())
    subtotal = Column(DECIMAL(12, 2), nullable=False, default=0)
    descuento = Column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos = Column(DECIMAL(12, 2), nullable=False, default=0)
    total = Column(DECIMAL(12, 2), nullable=False, default=0)
    estado = Column(
        Enum("Pendiente", "Cotizado", "Confirmado", "Cancelado", name="estado_venta"),
        nullable=False,
        default="Pendiente",
    )
    notas = Column(String(255), nullable=True)

    cliente = relationship("Usuario", foreign_keys=[cliente_id])
    operador = relationship("Usuario", foreign_keys=[usuario_operador_id])
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    factura = relationship("Factura", back_populates="venta", uselist=False)


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"), unique=True, nullable=False)
    numero_factura = Column(String(30), unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.now())
    subtotal = Column(DECIMAL(12, 2), nullable=False)
    descuento = Column(DECIMAL(12, 2), nullable=False, default=0)
    impuestos = Column(DECIMAL(12, 2), nullable=False)
    total = Column(DECIMAL(12, 2), nullable=False)
    estado = Column(Enum("Emitida", "Anulada", name="estado_factura"), nullable=False, default="Emitida")

    venta = relationship("Venta", back_populates="factura")
    cliente = relationship("Usuario")
    detalles = relationship("DetalleFactura", back_populates="factura", cascade="all, delete-orphan")


class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"

    id = Column(Integer, primary_key=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    descripcion = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    subtotal = Column(DECIMAL(12, 2), nullable=False)

    factura = relationship("Factura", back_populates="detalles")
    producto = relationship("Producto")


class PQR(Base):
    __tablename__ = "pqr"

    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(Enum("Peticion", "Queja", "Reclamo", name="tipo_pqr"), nullable=False)
    asunto = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    estado = Column(
        Enum("Pendiente", "En proceso", "Respondida", "Cerrada", name="estado_pqr"),
        nullable=False,
        default="Pendiente",
    )
    respuesta = Column(Text, nullable=True)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    cliente = relationship("Usuario")


class Conversacion(Base):
    __tablename__ = "conversaciones"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    iniciado_en = Column(TIMESTAMP, server_default=func.now())
    estado = Column(Enum("Activa", "Cerrada", name="estado_conversacion"), nullable=False, default="Activa")

    mensajes = relationship("Mensaje", back_populates="conversacion", cascade="all, delete-orphan")


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True)
    conversacion_id = Column(Integer, ForeignKey("conversaciones.id"), nullable=False)
    emisor = Column(Enum("Usuario", "Bot", name="emisor_mensaje"), nullable=False)
    contenido = Column(Text, nullable=False)
    enviado_en = Column(TIMESTAMP, server_default=func.now())

    conversacion = relationship("Conversacion", back_populates="mensajes")
