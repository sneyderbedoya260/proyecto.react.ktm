from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import requerir_rol
from app.migraciones import asegurar_migraciones
from app.models import Contenido

router = APIRouter(prefix="/api/contenido", tags=["Contenido"])

# Valores por defecto de todo el contenido editable del sitio. Si una clave no
# está en la base, se devuelve este valor, de modo que el sitio siempre tiene
# contenido aunque no se haya guardado nada aún.
DEFECTOS = {
    # Portada
    "home_kicker": "Ready to Race",
    "home_titulo": "Catálogo KTM",
    "home_subtitulo": "Descubre nuestra línea de motocicletas de alta gama, diseñadas para dominar la ciudad, la carretera y el terreno.",
    # Quiénes somos
    "quienes_titulo": "¿Quiénes Somos?",
    "quienes_texto": (
        "Somos un catálogo especializado en motocicletas KTM, la marca austriaca "
        "sinónimo de rendimiento, tecnología y espíritu \"Ready to Race\". "
        "Ofrecemos un espacio digital donde explorar el rango completo de modelos "
        "KTM, desde naked urbanas hasta motos de aventura y enduro.\n\n"
        "Nuestro compromiso es acercarte la pasión naranja con información clara, "
        "imágenes reales y una experiencia moderna."
    ),
    # Contacto (compartido por el footer y la página de contacto)
    "contacto_email": "contacto@ktmcatalogo.com",
    "contacto_telefono": "+57 300 000 0000",
    "contacto_direccion": "Concesionario KTM Autocolombiana, Medellín",
    "contacto_whatsapp": "573005156933",
    # Footer
    "footer_titulo": "Catálogo oficial",
    "footer_texto": "Descubre la moto perfecta para tu estilo, ya sea ciudad, aventura o pista.",
}


@router.get("")
def obtener_contenido(db: Session = Depends(get_db)):
    """Contenido del sitio como diccionario clave→valor (público)."""
    asegurar_migraciones(db)
    guardado = {c.clave: c.valor for c in db.query(Contenido).all()}
    return {**DEFECTOS, **guardado}


@router.put("")
def guardar_contenido(
    datos: dict = Body(...),
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador")),
):
    """Guarda (crea o actualiza) las claves de contenido enviadas (solo Admin)."""
    asegurar_migraciones(db)
    for clave, valor in datos.items():
        clave = str(clave)[:60]
        registro = db.query(Contenido).filter(Contenido.clave == clave).first()
        if registro:
            registro.valor = str(valor)
        else:
            db.add(Contenido(clave=clave, valor=str(valor)))
    db.commit()
    guardado = {c.clave: c.valor for c in db.query(Contenido).all()}
    return {**DEFECTOS, **guardado}
