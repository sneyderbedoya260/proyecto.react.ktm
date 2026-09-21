from datetime import datetime, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import obtener_usuario_actual, requerir_rol
from app.models import DetalleFactura, DetalleVenta, Factura, Venta
from app.schemas import FacturaOut
from app.utils.pdf import generar_pdf_factura

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def _siguiente_numero_factura(db: Session) -> str:
    total = db.query(Factura).count()
    return f"FAC-{total + 1:06d}"


def _serializar_factura(factura: Factura) -> dict:
    return {
        "id": factura.id,
        "venta_id": factura.venta_id,
        "numero_factura": factura.numero_factura,
        "cliente_id": factura.cliente_id,
        "cliente_nombre": f"{factura.cliente.nombre} {factura.cliente.apellido}" if factura.cliente else None,
        "fecha": factura.fecha,
        "subtotal": factura.subtotal,
        "descuento": factura.descuento,
        "impuestos": factura.impuestos,
        "total": factura.total,
        "estado": factura.estado,
        "detalles": [
            {
                "id": d.id,
                "producto_id": d.producto_id,
                "descripcion": d.descripcion,
                "cantidad": d.cantidad,
                "precio_unitario": d.precio_unitario,
                "subtotal": d.subtotal,
            }
            for d in factura.detalles
        ],
    }


@router.post("/generar/{venta_id}", response_model=FacturaOut, status_code=201)
def generar_factura(
    venta_id: int,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """REQ-07: genera la factura a partir de una venta/cotización ya registrada."""
    venta = db.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=404, detail={"mensaje": "Venta no encontrada."})
    if venta.factura:
        raise HTTPException(status_code=409, detail={"mensaje": "Esta venta ya tiene una factura generada."})

    factura = Factura(
        venta_id=venta.id,
        numero_factura=_siguiente_numero_factura(db),
        cliente_id=venta.cliente_id,
        subtotal=venta.subtotal,
        descuento=venta.descuento,
        impuestos=venta.impuestos,
        total=venta.total,
        detalles=[
            DetalleFactura(
                producto_id=detalle.producto_id,
                descripcion=detalle.producto.titulo if detalle.producto else "Producto",
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
                subtotal=detalle.subtotal,
            )
            for detalle in venta.detalles
        ],
    )
    venta.estado = "Confirmado"
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return _serializar_factura(factura)


@router.get("", response_model=List[FacturaOut])
def listar_facturas(
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
    numero_factura: Optional[str] = Query(None),
    cliente_id: Optional[int] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
):
    """REQ-08: consulta de facturas por número, cliente o rango de fechas."""
    consulta = db.query(Factura).options(joinedload(Factura.cliente), joinedload(Factura.detalles))

    if usuario.get("rolNombre") == "Cliente":
        consulta = consulta.filter(Factura.cliente_id == usuario["id"])
    elif cliente_id:
        consulta = consulta.filter(Factura.cliente_id == cliente_id)

    if numero_factura:
        consulta = consulta.filter(Factura.numero_factura.like(f"%{numero_factura}%"))
    if fecha_inicio:
        consulta = consulta.filter(Factura.fecha >= datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min))
    if fecha_fin:
        consulta = consulta.filter(Factura.fecha <= datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max))

    facturas = consulta.order_by(Factura.fecha.desc()).all()
    return [_serializar_factura(f) for f in facturas]


@router.get("/{factura_id}", response_model=FacturaOut)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail={"mensaje": "Factura no encontrada."})
    if usuario.get("rolNombre") == "Cliente" and factura.cliente_id != usuario["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes permisos para ver esta factura."})
    return _serializar_factura(factura)


@router.get("/{factura_id}/descargar")
def descargar_factura_pdf(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    """REQ-09: descarga de la factura en PDF."""
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail={"mensaje": "Factura no encontrada."})
    if usuario.get("rolNombre") == "Cliente" and factura.cliente_id != usuario["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes permisos para descargar esta factura."})

    pdf_bytes = generar_pdf_factura(factura, factura.detalles)
    nombre_archivo = f"{factura.numero_factura}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )
