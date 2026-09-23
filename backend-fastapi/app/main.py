from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, dashboard, facturas, imagenes, productos, reportes, ventas

app = FastAPI(
    title="KTM Catálogo — API",
    description="Backend FastAPI del Quinto Avance (React + Vite + FastAPI + SQL + IA).",
    version="1.0.0",
)

# El frontend vive en otro dominio de Vercel, así que el navegador exige CORS.
# El regex cubre además las URLs de preview que Vercel genera por cada commit.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origenes_cors,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(imagenes.router)
app.include_router(ventas.router)
app.include_router(facturas.router)
app.include_router(reportes.router)
app.include_router(dashboard.router)


@app.get("/api/salud", tags=["Salud"])
def salud():
    """Estado del servicio y de su configuración.

    Informa si el envío de correo está configurado (solo si las variables
    existen, nunca su valor) porque un fallo ahí es silencioso por diseño:
    /api/auth/recover-password responde igual se envíe el correo o no.
    """
    return {
        "estado": "ok",
        "servicio": "KTM Catálogo API (FastAPI)",
        "email_user_definido": bool(settings.EMAIL_USER),
        "email_pass_definido": bool(settings.EMAIL_PASS),
        "correo_configurado": bool(settings.EMAIL_USER and settings.EMAIL_PASS),
    }
