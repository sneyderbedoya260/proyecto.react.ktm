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

TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/gif"}
TAMANO_MAXIMO_MB = 5


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
        if imagen.content_type not in TIPOS_PERMITIDOS:
            raise HTTPException(
                status_code=400,
                detail={"mensaje": f"Formato no permitido en '{imagen.filename}'. Usa JPG, PNG, WEBP o GIF."},
            )
        contenido = await imagen.read()
        if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail={"mensaje": f"'{imagen.filename}' supera {TAMANO_MAXIMO_MB}MB."},
            )
        extension = os.path.splitext(imagen.filename or "")[1].lower() or ".jpg"
        nombre_unico = f"moto-{uuid.uuid4().hex}{extension}"
        db.add(Imagen(nombre=nombre_unico, tipo_mime=imagen.content_type, contenido=contenido))
        urls.append(f"{base}/api/imagenes/{nombre_unico}")

    db.commit()
    return {
        "mensaje": f"{len(urls)} imagen(es) subida(s) correctamente.",
        "urls": urls,
        # Compatibilidad: la primera imagen como url/imagen_url.
        "url": urls[0],
        "imagen_url": urls[0],
    }
