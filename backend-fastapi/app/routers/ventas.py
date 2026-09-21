from datetime import datetime, time
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.dependencies import obtener_usuario_actual, requerir_rol
from app.models import DetalleVenta, Producto, Usuario, Venta
from app.schemas import VentaCreateIn, VentaEstadoIn, VentaOut

router = APIRouter(prefix="/api/ventas", tags=["Ventas / Cotizaciones"])


def _serializar_venta(venta: Venta) -> dict:
    datos = {
        "id": venta.id,
        "cliente_id": venta.cliente_id,
        "cliente_nombre": f"{venta.cliente.nombre} {venta.cliente.apellido}" if venta.cliente else None,
        "usuario_operador_id": venta.usuario_operador_id,
        "fecha_hora": venta.fecha_hora,
        "subtotal": venta.subtotal,
        "descuento": venta.descuento,
        "impuestos": venta.impuestos,
        "total": venta.total,
        "estado": venta.estado,
        "notas": venta.notas,
        "detalles": [
            {
                "id": d.id,
                "producto_id": d.producto_id,
                "producto_titulo": d.producto.titulo if d.producto else None,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "subtotal": d.subtotal,
            }
            for d in venta.detalles
        ],
    }
    return datos


@router.post("", response_model=VentaOut, status_code=201)
def crear_venta(
    datos: VentaCreateIn,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    """REQ-01 / REQ-02: registra una solicitud de interés/cotización con sus productos."""
    es_staff = usuario.get("rolNombre") in ("Administrador", "Empleado")
    cliente_id = datos.cliente_id if (es_staff and datos.cliente_id) else usuario["id"]

    cliente = db.get(Usuario, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail={"mensaje": "Cliente no encontrado."})

    detalles: List[DetalleVenta] = []
    subtotal = Decimal("0")
    for item in datos.items:
        producto = db.get(Producto, item.producto_id)
        if not producto:
            raise HTTPException(status_code=404, detail={"mensaje": f"Producto {item.producto_id} no encontrado."})
        subtotal_item = producto.precio * item.cantidad
        subtotal += subtotal_item
        detalles.append(
            DetalleVenta(
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
                subtotal=subtotal_item,
            )
        )

    descuento = datos.descuento or Decimal("0")
    impuestos = (subtotal - descuento) * Decimal(str(settings.IVA_PORCENTAJE))
    total = subtotal - descuento + impuestos

    venta = Venta(
        cliente_id=cliente_id,
        usuario_operador_id=usuario["id"] if es_staff else None,
        subtotal=subtotal,
        descuento=descuento,
        impuestos=impuestos,
        total=total,
        notas=datos.notas,
        detalles=detalles,
    )
    db.add(venta)
    db.commit()
    db.refresh(venta)
    return _serializar_venta(venta)


@router.get("", response_model=List[VentaOut])
def listar_ventas(
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
    fecha_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="YYYY-MM-DD"),
    cliente_id: Optional[int] = Query(None),
    producto_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
):
    """REQ-03: historial de ventas con filtros por fecha, cliente, producto y estado."""
    consulta = db.query(Venta).options(joinedload(Venta.cliente), joinedload(Venta.detalles).joinedload(DetalleVenta.producto))

    # Un Cliente solo ve sus propias solicitudes; Admin/Empleado ven todo.
    if usuario.get("rolNombre") == "Cliente":
        consulta = consulta.filter(Venta.cliente_id == usuario["id"])
    elif cliente_id:
        consulta = consulta.filter(Venta.cliente_id == cliente_id)

    if fecha_inicio:
        consulta = consulta.filter(Venta.fecha_hora >= datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min))
    if fecha_fin:
        consulta = consulta.filter(Venta.fecha_hora <= datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max))
    if estado:
        consulta = consulta.filter(Venta.estado == estado)
    if producto_id:
        consulta = consulta.join(DetalleVenta).filter(DetalleVenta.producto_id == producto_id)

    ventas = consulta.order_by(Venta.fecha_hora.desc()).all()
    return [_serializar_venta(v) for v in ventas]


@router.get("/{venta_id}", response_model=VentaOut)
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    venta = db.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada."})
    if usuario.get("rolNombre") == "Cliente" and venta.cliente_id != usuario["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes permisos para ver esta solicitud."})
    return _serializar_venta(venta)


@router.put("/{venta_id}/estado", response_model=VentaOut)
def cambiar_estado_venta(
    venta_id: int,
    datos: VentaEstadoIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    venta = db.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada."})
    venta.estado = datos.estado
    db.commit()
    db.refresh(venta)
    return _serializar_venta(venta)
