from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Imagen

router = APIRouter(prefix="/api/imagenes", tags=["Imágenes"])


@router.get("/{nombre}")
def obtener_imagen(nombre: str, db: Session = Depends(get_db)):
    """Sirve una imagen subida desde el panel de administración.

    Las imágenes viven en la base de datos (ver app/models.py:Imagen), así que
    esta ruta es la que las convierte de vuelta en un archivo para el navegador.
    """
    imagen = db.query(Imagen).filter(Imagen.nombre == nombre).first()
    if not imagen:
        raise HTTPException(status_code=404, detail={"mensaje": "Imagen no encontrada."})

    return Response(
        content=imagen.contenido,
        media_type=imagen.tipo_mime,
        # El nombre incluye un uuid, así que el contenido nunca cambia.
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
