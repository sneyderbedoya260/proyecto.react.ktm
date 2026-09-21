from datetime import date, datetime, time
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import requerir_rol
from app.models import DetalleVenta, Venta
from app.schemas import ReporteDiarioOut
from app.utils.excel_export import generar_excel_reporte_diario
from app.utils.pdf import generar_pdf_reporte_diario

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


def _obtener_ventas_del_dia(db: Session, fecha_str: str):
    try:
        fecha_obj = datetime.fromisoformat(fecha_str).date()
    except ValueError:
        raise HTTPException(status_code=400, detail={"mensaje": "Fecha inválida. Usa el formato YYYY-MM-DD."})

    inicio = datetime.combine(fecha_obj, time.min)
    fin = datetime.combine(fecha_obj, time.max)

    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.cliente), joinedload(Venta.detalles).joinedload(DetalleVenta.producto))
        .filter(Venta.fecha_hora >= inicio, Venta.fecha_hora <= fin)
        .order_by(Venta.fecha_hora.asc())
        .all()
    )
    return fecha_obj, ventas


def _construir_filas_y_totales(ventas):
    filas = []
    total_unidades = 0
    total_recaudado = Decimal("0")

    for venta in ventas:
        cantidad_venta = sum(d.cantidad for d in venta.detalles)
        productos_texto = ", ".join(f"{d.producto.titulo} (x{d.cantidad})" for d in venta.detalles if d.producto)
        total_unidades += cantidad_venta
        total_recaudado += venta.total
        filas.append(
            {
                "numero_venta": venta.id,
                "fecha_hora": venta.fecha_hora.strftime("%Y-%m-%d %H:%M"),
                "cliente": f"{venta.cliente.nombre} {venta.cliente.apellido}" if venta.cliente else "N/D",
                "productos": productos_texto,
                "cantidad_total": cantidad_venta,
                "total": venta.total,
                "estado": venta.estado,
            }
        )

    totales = {
        "total_solicitudes": len(ventas),
        "total_unidades": total_unidades,
        "total_recaudado": total_recaudado,
    }
    return filas, totales


@router.get("/ventas-diario", response_model=ReporteDiarioOut)
def reporte_diario_json(
    fecha: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """REQ-04: reporte diario de ventas en JSON."""
    fecha_obj, ventas = _obtener_ventas_del_dia(db, fecha)
    filas, totales = _construir_filas_y_totales(ventas)
    return {
        "fecha": fecha_obj.isoformat(),
        "total_solicitudes": totales["total_solicitudes"],
        "total_unidades": totales["total_unidades"],
        "total_recaudado": totales["total_recaudado"],
        "ventas": filas,
    }


@router.get("/ventas-diario/pdf")
def reporte_diario_pdf(
    fecha: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """REQ-05: exportación del reporte diario en PDF."""
    fecha_obj, ventas = _obtener_ventas_del_dia(db, fecha)
    filas, totales = _construir_filas_y_totales(ventas)
    pdf_bytes = generar_pdf_reporte_diario(fecha_obj.isoformat(), filas, totales)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="reporte-{fecha_obj.isoformat()}.pdf"'},
    )


@router.get("/ventas-diario/excel")
def reporte_diario_excel(
    fecha: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """REQ-06: exportación del reporte diario en Excel (.xlsx)."""
    fecha_obj, ventas = _obtener_ventas_del_dia(db, fecha)
    filas, totales = _construir_filas_y_totales(ventas)
    excel_bytes = generar_excel_reporte_diario(fecha_obj.isoformat(), filas, totales)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="reporte-{fecha_obj.isoformat()}.xlsx"'},
    )
