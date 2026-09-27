import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import requerir_rol
from app.migraciones import asegurar_migraciones
from app.models import Imagen, Producto
from app.schemas import MensajeOut, ProductoIn, ProductoOut

router = APIRouter(prefix="/api/productos", tags=["Productos"])

# Formatos que el navegador muestra tal cual; cualquier otro se convierte a PNG.
TIPOS_WEB = {"image/jpeg", "image/png", "image/webp", "image/gif"}
TAMANO_MAXIMO_MB = 12

# Soporte opcional para más formatos (HEIC/HEIF de iPhone) si la librería está.
try:  # pragma: no cover
    import pillow_heif

    pillow_heif.register_heif_opener()
except Exception:  # noqa: BLE001
    pass


def procesar_imagen(nombre_archivo: str, tipo: str, datos: bytes):
    """Devuelve (bytes, tipo_mime, extension) listos para servir en la web.

    - Los formatos que el navegador ya muestra (JPG, PNG, WEBP, GIF) se guardan
      tal cual.
    - Los SVG (vectoriales) se guardan tal cual.
    - Cualquier otro formato de imagen (BMP, TIFF, HEIC, etc.) se convierte a
      PNG con Pillow, para que SIEMPRE se vea, sin importar qué subió el usuario.
    """
    nombre = (nombre_archivo or "").lower()
    if tipo in TIPOS_WEB:
        ext = os.path.splitext(nombre)[1].lower() or {
            "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
        }.get(tipo, ".img")
        return datos, tipo, ext
    if tipo == "image/svg+xml" or nombre.endswith(".svg"):
        return datos, "image/svg+xml", ".svg"

    # Convertir a PNG con Pillow (conserva transparencia).
    from io import BytesIO

    try:
        from PIL import Image
    except ImportError:
        raise HTTPException(
            status_code=400,
            detail={"mensaje": f"No se pudo procesar '{nombre_archivo}'. Usa JPG, PNG, WEBP, GIF o SVG."},
        )
    try:
        imagen = Image.open(BytesIO(datos))
        imagen = imagen.convert("RGBA") if imagen.mode in ("P", "LA", "RGBA") else imagen.convert("RGB")
        salida = BytesIO()
        imagen.save(salida, format="PNG")
        return salida.getvalue(), "image/png", ".png"
    except Exception:  # noqa: BLE001
        raise HTTPException(
            status_code=400,
            detail={"mensaje": f"'{nombre_archivo}' no es una imagen válida o no se pudo convertir."},
        )


@router.get("", response_model=List[ProductoOut])
def listar_productos(db: Session = Depends(get_db)):
    asegurar_migraciones(db)
    return db.query(Producto).order_by(Producto.id.desc()).all()


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado."})
    return producto


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    asegurar_migraciones(db)
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int,
    datos: ProductoIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    asegurar_migraciones(db)
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado."})
    for campo, valor in datos.model_dump().items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", response_model=MensajeOut)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail={"mensaje": "Producto no encontrado."})
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado."}


@router.post("/upload")
async def subir_imagen(
    request: Request,
    imagenes: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """Guarda una o varias imágenes y devuelve sus URLs.

    Acepta múltiples archivos (campo `imagenes`) para que el administrador pueda
    subir varias fotos de un producto de una vez. Las imágenes se guardan en la
    base (el disco serverless es de solo lectura) y se sirven desde
    /api/imagenes/{nombre}.
    """
    asegurar_migraciones(db)
    if not imagenes:
        raise HTTPException(status_code=400, detail={"mensaje": "No se recibió ninguna imagen."})

    # Base absoluta (el frontend vive en otro dominio); se fuerza https tras el
    # proxy de Vercel para no romper por contenido mixto.
    base = str(request.base_url).rstrip("/")
    if settings.es_serverless and base.startswith("http://"):
        base = "https://" + base[len("http://") :]

    urls: List[str] = []
    for imagen in imagenes:
        crudo = await imagen.read()
        if len(crudo) > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail={"mensaje": f"'{imagen.filename}' supera {TAMANO_MAXIMO_MB}MB."},
            )
        # Acepta cualquier formato de foto y lo deja listo para verse en la web.
        contenido, tipo_mime, extension = procesar_imagen(imagen.filename, imagen.content_type or "", crudo)
        nombre_unico = f"moto-{uuid.uuid4().hex}{extension}"
        db.add(Imagen(nombre=nombre_unico, tipo_mime=tipo_mime, contenido=contenido))
        urls.append(f"{base}/api/imagenes/{nombre_unico}")

    db.commit()
    return {
        "mensaje": f"{len(urls)} imagen(es) subida(s) correctamente.",
        "urls": urls,
        # Compatibilidad: la primera imagen como url/imagen_url.
        "url": urls[0],
        "imagen_url": urls[0],
    }
