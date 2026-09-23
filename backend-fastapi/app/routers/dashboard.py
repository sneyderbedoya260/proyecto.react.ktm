from collections import OrderedDict
from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import requerir_rol
from app.models import PQR, Producto, Usuario

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

ESTADOS_PRODUCTO = ["Disponible", "Agotado", "Inactivo"]


# --------------------------------------------------------------------------- #
# REQ-10: Dashboard administrativo — Cards con totales generales.
# REQ-12: Solo Administrador/Empleado pueden ver el dashboard (seguridad por
#         roles); un Cliente recibe 403 si intenta acceder a estas rutas.
#
# El sitio es un catálogo de consulta, no una tienda: los indicadores miden el
# catálogo (modelos, categorías, disponibilidad) y la atención al cliente (PQR),
# no ventas ni facturación.
# --------------------------------------------------------------------------- #
@router.get("/resumen")
def resumen(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    total_usuarios = db.query(func.count(Usuario.id)).scalar() or 0
    total_productos = db.query(func.count(Producto.id)).scalar() or 0
    disponibles = db.query(func.count(Producto.id)).filter(Producto.estado == "Disponible").scalar() or 0
    agotados = db.query(func.count(Producto.id)).filter(Producto.estado == "Agotado").scalar() or 0
    inactivos = db.query(func.count(Producto.id)).filter(Producto.estado == "Inactivo").scalar() or 0
    total_categorias = db.query(func.count(func.distinct(Producto.categoria))).scalar() or 0
    total_pqr = db.query(func.count(PQR.id)).scalar() or 0
    pqr_pendientes = (
        db.query(func.count(PQR.id)).filter(PQR.estado.in_(["Pendiente", "En proceso"])).scalar() or 0
    )

    return {
        "total_usuarios": total_usuarios,
        "total_productos": total_productos,
        "productos_disponibles": disponibles,
        "productos_agotados": agotados,
        "productos_inactivos": inactivos,
        "total_categorias": total_categorias,
        "total_pqr": total_pqr,
        "pqr_pendientes": pqr_pendientes,
    }


# --------------------------------------------------------------------------- #
# REQ-13: opciones para poblar los filtros del dashboard.
# --------------------------------------------------------------------------- #
@router.get("/filtros")
def filtros(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    categorias = db.query(Producto.categoria).distinct().order_by(Producto.categoria).all()
    return {
        "categorias": [c.categoria for c in categorias if c.categoria],
        "estados": ESTADOS_PRODUCTO,
    }


def _clave_periodo(fecha: datetime, agrupacion: str) -> str:
    if agrupacion == "semana":
        anio, semana, _ = fecha.isocalendar()
        return f"{anio}-S{semana:02d}"
    if agrupacion == "mes":
        return fecha.strftime("%Y-%m")
    return fecha.strftime("%Y-%m-%d")  # día (por defecto)


# --------------------------------------------------------------------------- #
# REQ-11: gráfico de barras (modelos por categoría) + línea (modelos publicados
#         por día/semana/mes), con indicadores numéricos.
# REQ-13: filtrable por fecha inicial/final, categoría y estado.
# --------------------------------------------------------------------------- #
@router.get("/catalogo")
def dashboard_catalogo(
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
    fecha_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="YYYY-MM-DD"),
    agrupacion: str = Query("dia", pattern="^(dia|semana|mes)$"),
    categoria: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
):
    consulta = db.query(Producto)

    if fecha_inicio:
        consulta = consulta.filter(
            Producto.creado_en >= datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min)
        )
    if fecha_fin:
        consulta = consulta.filter(
            Producto.creado_en <= datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max)
        )
    if categoria:
        consulta = consulta.filter(Producto.categoria == categoria)
    if estado:
        consulta = consulta.filter(Producto.estado == estado)

    productos = consulta.order_by(Producto.creado_en.asc()).all()

    por_categoria: "OrderedDict[str, int]" = OrderedDict()
    por_estado: "OrderedDict[str, int]" = OrderedDict((e, 0) for e in ESTADOS_PRODUCTO)
    series: "OrderedDict[str, int]" = OrderedDict()

    for producto in productos:
        nombre_categoria = producto.categoria or "Sin categoría"
        por_categoria[nombre_categoria] = por_categoria.get(nombre_categoria, 0) + 1
        por_estado[producto.estado] = por_estado.get(producto.estado, 0) + 1
        if producto.creado_en:
            clave = _clave_periodo(producto.creado_en, agrupacion)
            series[clave] = series.get(clave, 0) + 1

    return {
        "agrupacion": agrupacion,
        "por_categoria": [
            {"categoria": nombre, "cantidad": cantidad}
            for nombre, cantidad in sorted(por_categoria.items(), key=lambda par: -par[1])
        ],
        "por_estado": [{"estado": nombre, "cantidad": cantidad} for nombre, cantidad in por_estado.items()],
        "labels": list(series.keys()),
        "publicados": list(series.values()),
        "total_modelos": len(productos),
        "total_categorias": len(por_categoria),
    }
