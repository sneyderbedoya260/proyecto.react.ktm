from collections import OrderedDict
from datetime import datetime, time
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import requerir_rol
from app.models import DetalleVenta, Factura, Producto, Usuario, Venta, PQR

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# --------------------------------------------------------------------------- #
# REQ-10: Dashboard administrativo — Cards con totales generales.
# REQ-12: Solo Administrador/Empleado pueden ver el dashboard (seguridad por
#         roles); un Cliente recibe 403 si intenta acceder a estas rutas.
# --------------------------------------------------------------------------- #
@router.get("/resumen")
def resumen(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    total_ventas = db.query(func.count(Venta.id)).scalar() or 0
    total_facturacion = db.query(func.coalesce(func.sum(Factura.total), 0)).scalar() or 0
    total_pqr = db.query(func.count(PQR.id)).scalar() or 0
    pqr_pendientes = (
        db.query(func.count(PQR.id)).filter(PQR.estado.in_(["Pendiente", "En proceso"])).scalar() or 0
    )

    return {
        "total_usuarios": total_usuarios,
        "total_productos": total_productos,
        "total_ventas": total_ventas,
        "total_facturacion": float(total_facturacion),
        "total_pqr": total_pqr,
        "pqr_pendientes": pqr_pendientes,
    }


# --------------------------------------------------------------------------- #
# REQ-13: opciones para poblar los filtros del dashboard (productos/clientes).
# --------------------------------------------------------------------------- #
@router.get("/filtros")
def filtros(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    productos = db.query(Producto.id, Producto.titulo).order_by(Producto.titulo).all()
    clientes = (
        db.query(Usuario.id, Usuario.nombre, Usuario.apellido)
        .join(Venta, Venta.cliente_id == Usuario.id)
        .distinct()
        .order_by(Usuario.nombre)
        .all()
    )
    return {
        "productos": [{"id": p.id, "titulo": p.titulo} for p in productos],
        "clientes": [{"id": c.id, "nombre": f"{c.nombre} {c.apellido}"} for c in clientes],
        "estados": ["Pendiente", "Cotizado", "Confirmado", "Cancelado"],
    }


def _clave_periodo(fecha: datetime, agrupacion: str) -> str:
    if agrupacion == "semana":
        anio, semana, _ = fecha.isocalendar()
        return f"{anio}-S{semana:02d}"
    if agrupacion == "mes":
        return fecha.strftime("%Y-%m")
    return fecha.strftime("%Y-%m-%d")  # día (por defecto)


# --------------------------------------------------------------------------- #
# REQ-11: gráfico de barras (cantidad de solicitudes) + línea (total $) por
#         día/semana/mes, con indicadores numéricos.
# REQ-13: filtrable por fecha inicial/final, producto, servicio*, estado y
#         cliente. (*No hay "servicios" como entidad separada en este
#         catálogo: solo motos/productos, así que el filtro de producto
#         cubre ese requerimiento).
# --------------------------------------------------------------------------- #
@router.get("/ventas")
def dashboard_ventas(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
    fecha_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="YYYY-MM-DD"),
    agrupacion: str = Query("dia", pattern="^(dia|semana|mes)$"),
    producto_id: Optional[int] = Query(None),
    cliente_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
):
    consulta = db.query(Venta).options(joinedload(Venta.detalles))

    if fecha_inicio:
        consulta = consulta.filter(Venta.fecha_hora >= datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min))
    if fecha_fin:
        consulta = consulta.filter(Venta.fecha_hora <= datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max))
    if cliente_id:
        consulta = consulta.filter(Venta.cliente_id == cliente_id)
    if estado:
        consulta = consulta.filter(Venta.estado == estado)
    if producto_id:
        consulta = consulta.join(DetalleVenta).filter(DetalleVenta.producto_id == producto_id)

    ventas = consulta.order_by(Venta.fecha_hora.asc()).all()

    series: "OrderedDict[str, dict]" = OrderedDict()
    for venta in ventas:
        clave = _clave_periodo(venta.fecha_hora, agrupacion)
        if clave not in series:
            series[clave] = {"cantidad_solicitudes": 0, "total": Decimal("0")}
        series[clave]["cantidad_solicitudes"] += 1
        series[clave]["total"] += venta.total

    return {
        "agrupacion": agrupacion,
        "labels": list(series.keys()),
        "cantidad_solicitudes": [v["cantidad_solicitudes"] for v in series.values()],
        "totales": [float(v["total"]) for v in series.values()],
        "total_periodo": float(sum((v["total"] for v in series.values()), Decimal("0"))),
        "solicitudes_periodo": sum(v["cantidad_solicitudes"] for v in series.values()),
    }
