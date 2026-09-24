from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth, chatbot, dashboard, imagenes, productos, pqr, usuarios,
)

app = FastAPI(
    title="KTM Catálogo — API",
    description="Backend FastAPI del Quinto Avance (React + Vite + FastAPI + SQL + IA).",
    version="1.0.0",
)


# Cabeceras de seguridad en cada respuesta de la API.
@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    respuesta = await call_next(request)
    # No adivinar el tipo de contenido (evita que un .txt se ejecute como HTML).
    respuesta.headers["X-Content-Type-Options"] = "nosniff"
    # La API nunca debe embeberse en un iframe (anti-clickjacking).
    respuesta.headers["X-Frame-Options"] = "DENY"
    respuesta.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    respuesta.headers["Referrer-Policy"] = "no-referrer"
    respuesta.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return respuesta


# El frontend vive en otro dominio de Vercel, así que el navegador exige CORS.
# Se aceptan solo los orígenes configurados y las URLs de preview de ESTE
# proyecto (no cualquier *.vercel.app, que dejaba entrar sitios ajenos).
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origenes_cors,
    allow_origin_regex=settings.cors_preview_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(chatbot.router)
app.include_router(productos.router)
app.include_router(imagenes.router)
app.include_router(dashboard.router)
app.include_router(pqr.router)
app.include_router(usuarios.router)


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
