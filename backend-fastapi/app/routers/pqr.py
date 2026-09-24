from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import obtener_usuario_actual, requerir_rol
from app.models import PQR, Usuario
from app.schemas import PQRCreateIn, PQROut, PQRRespuestaIn

router = APIRouter(prefix="/api/pqr", tags=["PQR"])


def _serializar(p: PQR) -> dict:
    return {
        "id": p.id,
        "cliente_id": p.cliente_id,
        "cliente_nombre": f"{p.cliente.nombre} {p.cliente.apellido}" if p.cliente else None,
        "tipo": p.tipo,
        "asunto": p.asunto,
        "mensaje": p.mensaje,
        "estado": p.estado,
        "respuesta": p.respuesta,
        "creado_en": p.creado_en,
        "actualizado_en": p.actualizado_en,
    }


@router.post("", response_model=PQROut, status_code=201)
def crear_pqr(
    datos: PQRCreateIn,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    """REQ-16: el cliente registra una Petición, Queja o Reclamo."""
    pqr = PQR(
        cliente_id=usuario["id"],
        tipo=datos.tipo,
        asunto=datos.asunto,
        mensaje=datos.mensaje,
    )
    db.add(pqr)
    db.commit()
    db.refresh(pqr)
    return _serializar(pqr)


@router.get("", response_model=List[PQROut])
def listar_pqr(
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
    estado: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
):
    """REQ-16: el cliente consulta sus PQR; el staff ve todas y puede filtrar."""
    consulta = db.query(PQR).options(joinedload(PQR.cliente))

    if usuario.get("rolNombre") == "Cliente":
        consulta = consulta.filter(PQR.cliente_id == usuario["id"])
    if estado:
        consulta = consulta.filter(PQR.estado == estado)
    if tipo:
        consulta = consulta.filter(PQR.tipo == tipo)

    return [_serializar(p) for p in consulta.order_by(PQR.creado_en.desc()).all()]


@router.get("/{pqr_id}", response_model=PQROut)
def obtener_pqr(
    pqr_id: int,
    db: Session = Depends(get_db),
    usuario: dict = Depends(obtener_usuario_actual),
):
    pqr = db.get(PQR, pqr_id)
    if not pqr:
        raise HTTPException(status_code=404, detail={"mensaje": "PQR no encontrada."})
    if usuario.get("rolNombre") == "Cliente" and pqr.cliente_id != usuario["id"]:
        raise HTTPException(status_code=403, detail={"mensaje": "No tienes permisos para ver esta PQR."})
    return _serializar(pqr)


@router.put("/{pqr_id}", response_model=PQROut)
def responder_pqr(
    pqr_id: int,
    datos: PQRRespuestaIn,
    db: Session = Depends(get_db),
    _usuario: dict = Depends(requerir_rol("Administrador", "Empleado")),
):
    """REQ-16: el staff cambia el estado y responde la PQR."""
    pqr = db.get(PQR, pqr_id)
    if not pqr:
        raise HTTPException(status_code=404, detail={"mensaje": "PQR no encontrada."})
    pqr.estado = datos.estado
    if datos.respuesta is not None:
        pqr.respuesta = datos.respuesta
    db.commit()
    db.refresh(pqr)
    return _serializar(pqr)
