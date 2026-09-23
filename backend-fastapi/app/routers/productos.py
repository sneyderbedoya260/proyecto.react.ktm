import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import requerir_rol
from app.models import Imagen, Producto
from app.schemas import MensajeOut, ProductoIn, ProductoOut

router = APIRouter(prefix="/api/productos", tags=["Productos"])

TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/gif"}
TAMANO_MAXIMO_MB = 5


@router.get("", response_model=List[ProductoOut])
def listar_productos(db: Session = Depends(get_db)):
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
    imagen: UploadFile = File(...),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """Guarda la imagen en la base de datos y devuelve la URL para servirla.

    Antes se escribía en public/images/, pero en una función serverless el
    disco es de solo lectura y además se borra entre invocaciones, así que la
    imagen se guarda en Neon y se sirve desde /api/imagenes/{nombre}.
    """
    if imagen.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail={"mensaje": "Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF."},
        )

    contenido = await imagen.read()
    if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"mensaje": f"La imagen no puede superar {TAMANO_MAXIMO_MB}MB."})

    extension = os.path.splitext(imagen.filename or "")[1].lower() or ".jpg"
    nombre_unico = f"moto-{uuid.uuid4().hex}{extension}"

    db.add(Imagen(nombre=nombre_unico, tipo_mime=imagen.content_type, contenido=contenido))
    db.commit()

    # Absoluta: el frontend está en otro dominio y no puede resolverla relativa.
    base = str(request.base_url).rstrip("/")
    if settings.es_serverless and base.startswith("http://"):
        # Detrás del proxy de Vercel el esquema puede llegar como http; forzar
        # https evita que el navegador bloquee la imagen por contenido mixto.
        base = "https://" + base[len("http://") :]
    url = f"{base}/api/imagenes/{nombre_unico}"
    return {"mensaje": "Imagen subida correctamente.", "url": url, "imagen_url": url}
