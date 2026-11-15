import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile, File, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Incidencia, Maquina, utc_now
from app.schemas import IncidenciaOut, MaquinaResumen

router = APIRouter(prefix="/incidencias", tags=["Incidencias"])


def derivar_turno(dt: datetime) -> str:
    """Decisión de cátedra: el turno se deriva de la hora del reporte."""
    hora = dt.hour
    if 6 <= hora < 14:
        return "manana"
    elif 14 <= hora < 22:
        return "tarde"
    return "noche"


def serializar_incidencia(inc: Incidencia, session: Session) -> IncidenciaOut:
    """Convierte un modelo Incidencia al schema OpenAPI con datos de la máquina."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == inc.maquina_codigo)
    ).first()

    fotos_lista = []
    if inc.fotos:
        try:
            fotos_lista = json.loads(inc.fotos)
        except Exception:
            fotos_lista = [inc.fotos]

    return IncidenciaOut(
        id=inc.id or 0,
        maquinaCodigo=inc.maquina_codigo,
        maquina=(
            MaquinaResumen(
                codigo=maquina.codigo,
                nombre=maquina.nombre,
                linea=maquina.linea,
            )
            if maquina
            else None
        ),
        descripcion=inc.descripcion,
        tipoFalla=inc.tipo_falla,
        prioridad=inc.prioridad,
        fotos=fotos_lista,
        repuestosEstimados=[],
        estado=inc.estado,
        turno=inc.turno,
        reportadaPor=inc.reportada_por,
        creadaEn=inc.creada_en.isoformat(),
    )


@router.get("", response_model=List[IncidenciaOut])
def listar_incidencias(
    session: Session = Depends(get_session),
) -> List[IncidenciaOut]:
    """Lista todas las incidencias registradas en la planta."""
    incidencias = session.exec(
        select(Incidencia).order_by(Incidencia.creada_en.desc())
    ).all()
    return [serializar_incidencia(i, session) for i in incidencias]


@router.post("", response_model=IncidenciaOut, status_code=status.HTTP_201_CREATED)
async def crear_incidencia(
    request: Request,
    session: Session = Depends(get_session),
) -> IncidenciaOut:
    """Crea un nuevo reporte de falla / incidencia (soporta FormData con fotos y JSON)."""
    content_type = request.headers.get("content-type", "")

    ahora = utc_now()
    turno_actual = derivar_turno(ahora)

    if "multipart/form-data" in content_type:
        form = await request.form()
        maquina_codigo = str(form.get("maquinaCodigo") or "").strip()
        descripcion = str(form.get("descripcion") or "").strip()
        prioridad = str(form.get("prioridad") or "normal")
        tipo_falla = form.get("tipoFalla")
        tipo_falla = str(tipo_falla) if tipo_falla else None

        archivos = form.getlist("fotos")
        nombres_fotos = []
        for a in archivos:
            if hasattr(a, "filename") and a.filename:
                nombres_fotos.append(a.filename)
    else:
        body = await request.json()
        maquina_codigo = str(body.get("maquinaCodigo") or "").strip()
        descripcion = str(body.get("descripcion") or "").strip()
        prioridad = str(body.get("prioridad") or "normal")
        tipo_falla = body.get("tipoFalla")
        nombres_fotos = body.get("fotos", [])

    if not maquina_codigo or not descripcion:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="maquinaCodigo y descripcion son requeridos",
        )

    # Validar que la máquina exista
    maq = session.exec(
        select(Maquina).where(Maquina.codigo == maquina_codigo)
    ).first()
    if not maq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Máquina {maquina_codigo} no encontrada",
        )

    nueva = Incidencia(
        maquina_codigo=maquina_codigo,
        descripcion=descripcion,
        tipo_falla=tipo_falla,
        prioridad=prioridad,
        fotos=json.dumps(nombres_fotos),
        estado="abierta",
        turno=turno_actual,
        reportada_por="Operario de Planta",
        creada_en=ahora,
    )
    session.add(nueva)
    session.commit()
    session.refresh(nueva)

    return serializar_incidencia(nueva, session)


@router.get("/{id}", response_model=IncidenciaOut)
def obtener_incidencia(
    id: int, session: Session = Depends(get_session)
) -> IncidenciaOut:
    """Detalle de una incidencia por su ID."""
    inc = session.exec(select(Incidencia).where(Incidencia.id == id)).first()
    if not inc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la incidencia #{id}",
        )
    return serializar_incidencia(inc, session)
