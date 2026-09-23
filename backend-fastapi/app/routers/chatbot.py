import json
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Producto
from app.rate_limit import exigir_limite, ip_cliente, registrar_intento

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# Topes para controlar el costo y el abuso: nadie debe poder usar el endpoint
# como un LLM gratis de propósito general.
MAX_LARGO_MENSAJE = 600
MAX_TURNOS_HISTORIAL = 10
MAX_TOKENS_RESPUESTA = 500
CHAT_MAX_POR_IP = 40
CHAT_VENTANA_SEGUNDOS = 10 * 60

PERSONA = (
    "Eres 'KTM Bot', el asistente virtual del catálogo KTM. Respondes en español, "
    "con tono cercano y profesional, en mensajes breves. Ayudas a los visitantes a "
    "conocer los modelos de moto del catálogo, comparar categorías (naked, adventure, "
    "enduro, supermoto, sport, sport touring) y orientarlos sobre cuál se ajusta a su uso "
    "(ciudad, viaje, off-road, pista). Este es un catálogo de consulta, NO una tienda: "
    "no vendes, no tomas pedidos ni pagos; si preguntan por comprar, invita a usar el "
    "formulario de contacto o el WhatsApp del sitio. No inventes precios ni fichas técnicas: "
    "usa solo los datos del catálogo que se te entregan. Si te preguntan algo ajeno a KTM o "
    "al sitio, recondúcelo con amabilidad hacia las motos del catálogo."
)


class ChatIn(BaseModel):
    mensaje: str = Field(min_length=1, max_length=MAX_LARGO_MENSAJE)
    historial: list[dict] = Field(default_factory=list)


def _catalogo_para_prompt(db: Session) -> str:
    productos = db.query(Producto).order_by(Producto.categoria, Producto.titulo).all()
    if not productos:
        return "El catálogo está vacío por ahora."
    lineas = []
    for p in productos:
        precio = f"${int(p.precio):,} COP".replace(",", ".") if p.precio else "consultar"
        lineas.append(f"- {p.titulo} ({p.categoria}, {p.estado}): {p.descripcion} Precio: {precio}.")
    return "Catálogo actual:\n" + "\n".join(lineas)


def _construir_contenidos(historial: list[dict], mensaje: str) -> list[dict]:
    contenidos = []
    # Solo los últimos turnos, para no disparar el costo en tokens.
    for turno in historial[-MAX_TURNOS_HISTORIAL:]:
        texto = str(turno.get("texto", "")).strip()[:MAX_LARGO_MENSAJE]
        if not texto:
            continue
        rol = "model" if turno.get("rol") == "bot" else "user"
        contenidos.append({"role": rol, "parts": [{"text": texto}]})
    contenidos.append({"role": "user", "parts": [{"text": mensaje.strip()}]})
    return contenidos


def _llamar_gemini(instruccion_sistema: str, contenidos: list[dict]) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    )
    cuerpo = {
        "system_instruction": {"parts": [{"text": instruccion_sistema}]},
        "contents": contenidos,
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": MAX_TOKENS_RESPUESTA},
    }
    peticion = urllib.request.Request(
        url,
        data=json.dumps(cuerpo).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(peticion, timeout=25) as respuesta:
        datos = json.loads(respuesta.read().decode("utf-8"))

    candidatos = datos.get("candidates") or []
    if not candidatos:
        # Puede venir vacío si el contenido se bloqueó por filtros de seguridad.
        raise ValueError("Gemini no devolvió contenido.")
    partes = candidatos[0].get("content", {}).get("parts", [])
    texto = "".join(parte.get("text", "") for parte in partes).strip()
    if not texto:
        raise ValueError("Gemini devolvió una respuesta vacía.")
    return texto


@router.post("")
def conversar(datos: ChatIn, request: Request, db: Session = Depends(get_db)):
    exigir_limite(
        db, f"chatbot:{ip_cliente(request)}", limite=CHAT_MAX_POR_IP, ventana_segundos=CHAT_VENTANA_SEGUNDOS
    )
    registrar_intento(db, f"chatbot:{ip_cliente(request)}")

    if not settings.GEMINI_API_KEY:
        # Sin clave configurada respondemos con un mensaje claro en vez de un 500,
        # para que el widget siga siendo usable y el fallo sea evidente.
        return {
            "respuesta": (
                "El asistente aún no está disponible. Mientras tanto, puedes escribirnos "
                "por el formulario de contacto o el WhatsApp del sitio."
            ),
            "configurado": False,
        }

    instruccion = f"{PERSONA}\n\n{_catalogo_para_prompt(db)}"
    contenidos = _construir_contenidos(datos.historial, datos.mensaje)

    try:
        respuesta = _llamar_gemini(instruccion, contenidos)
    except urllib.error.HTTPError as error:
        detalle = error.read().decode("utf-8", "ignore")[:300]
        print(f"[chatbot] Gemini HTTP {error.code}: {detalle}")
        raise HTTPException(
            status_code=502,
            detail={"mensaje": "El asistente no está disponible en este momento. Intenta más tarde."},
        )
    except Exception as error:  # noqa: BLE001
        print(f"[chatbot] error: {error!r}")
        raise HTTPException(
            status_code=502,
            detail={"mensaje": "El asistente no está disponible en este momento. Intenta más tarde."},
        )

    return {"respuesta": respuesta, "configurado": True}
