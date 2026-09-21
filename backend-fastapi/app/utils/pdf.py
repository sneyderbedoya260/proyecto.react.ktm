from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

NARANJA_KTM = colors.HexColor("#FF6600")
NEGRO_KTM = colors.HexColor("#0D0D0D")

estilos = getSampleStyleSheet()
titulo_estilo = ParagraphStyle("TituloKTM", parent=estilos["Title"], textColor=NARANJA_KTM, fontSize=18)
subtitulo_estilo = ParagraphStyle("SubtituloKTM", parent=estilos["Normal"], textColor=colors.grey, fontSize=10)


def generar_pdf_reporte_diario(fecha: str, filas: list[dict], totales: dict) -> bytes:
    buffer = BytesIO()
    documento = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elementos = [
        Paragraph("KTM Catálogo — Reporte diario de solicitudes/ventas", titulo_estilo),
        Paragraph(f"Fecha: {fecha}", subtitulo_estilo),
        Spacer(1, 14),
    ]

    encabezado = ["N° Venta", "Fecha/Hora", "Cliente", "Productos", "Cant.", "Total", "Estado"]
    datos_tabla = [encabezado]
    for fila in filas:
        datos_tabla.append(
            [
                str(fila["numero_venta"]),
                fila["fecha_hora"],
                fila["cliente"],
                fila["productos"],
                str(fila["cantidad_total"]),
                f"${fila['total']:,.2f}",
                fila["estado"],
            ]
        )

    tabla = Table(datos_tabla, repeatRows=1)
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NEGRO_KTM),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elementos.append(tabla)
    elementos.append(Spacer(1, 16))

    resumen = (
        f"Total solicitudes: {totales['total_solicitudes']}  |  "
        f"Unidades totales: {totales['total_unidades']}  |  "
        f"Total recaudado: ${totales['total_recaudado']:,.2f}"
    )
    elementos.append(Paragraph(resumen, estilos["Normal"]))

    documento.build(elementos)
    return buffer.getvalue()


def generar_pdf_factura(factura, detalles) -> bytes:
    buffer = BytesIO()
    documento = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    elementos = [
        Paragraph("KTM Catálogo — Factura", titulo_estilo),
        Paragraph(f"N° Factura: {factura.numero_factura}", subtitulo_estilo),
        Paragraph(f"Fecha: {factura.fecha.strftime('%Y-%m-%d %H:%M')}", subtitulo_estilo),
        Paragraph(f"Cliente: {factura.cliente.nombre} {factura.cliente.apellido} ({factura.cliente.correo})", subtitulo_estilo),
        Spacer(1, 14),
    ]

    encabezado = ["Producto", "Cant.", "Precio unitario", "Subtotal"]
    datos_tabla = [encabezado]
    for detalle in detalles:
        datos_tabla.append(
            [
                detalle.descripcion,
                str(detalle.cantidad),
                f"${detalle.precio_unitario:,.2f}",
                f"${detalle.subtotal:,.2f}",
            ]
        )

    tabla = Table(datos_tabla, repeatRows=1)
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NEGRO_KTM),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.whitesmoke]),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ]
        )
    )
    elementos.append(tabla)
    elementos.append(Spacer(1, 16))

    resumen_estilo = ParagraphStyle("Resumen", parent=estilos["Normal"], alignment=2)
    elementos.append(Paragraph(f"Subtotal: ${factura.subtotal:,.2f}", resumen_estilo))
    elementos.append(Paragraph(f"Descuento: ${factura.descuento:,.2f}", resumen_estilo))
    elementos.append(Paragraph(f"Impuestos: ${factura.impuestos:,.2f}", resumen_estilo))
    elementos.append(
        Paragraph(f"<b>Total: ${factura.total:,.2f}</b>", ParagraphStyle("Total", parent=resumen_estilo, textColor=NARANJA_KTM, fontSize=13))
    )

    documento.build(elementos)
    return buffer.getvalue()
