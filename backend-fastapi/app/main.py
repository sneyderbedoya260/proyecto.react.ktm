from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, dashboard, facturas, productos, reportes, ventas

app = FastAPI(
    title="KTM Catálogo — API",
    description="Backend FastAPI del Quinto Avance (React + Vite + FastAPI + SQL + IA).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory="public/images"), name="images")

app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(facturas.router)
app.include_router(reportes.router)
app.include_router(dashboard.router)


@app.get("/api/salud", tags=["Salud"])
def salud():
    return {"estado": "ok", "servicio": "KTM Catálogo API (FastAPI)"}
