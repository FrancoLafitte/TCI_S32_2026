from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Maquina, MaquinaRepuesto, Repuesto
from app.schemas import MaquinaOut, MaquinaCreate

router = APIRouter(prefix="/maquinas", tags=["Maquinas"])


def serializar_maquina(maquina: Maquina, session: Session) -> MaquinaOut:
    """Serializa una máquina con la lista de repuestos a mantener."""
    statement = select(MaquinaRepuesto.repuesto_codigo).where(
        MaquinaRepuesto.maquina_codigo == maquina.codigo
    )
    repuestos = session.exec(statement).all()

    return MaquinaOut(
        codigo=maquina.codigo,
        nombre=maquina.nombre,
        tipo=maquina.tipo,
        ejemplar=maquina.ejemplar,
        linea=maquina.linea,
        estado=maquina.estado,
        repuestosAMantener=list(repuestos),
    )


@router.get("", response_model=List[MaquinaOut])
def listar_maquinas(session: Session = Depends(get_session)) -> List[MaquinaOut]:
    """Devuelve el parque de maquinaria de la planta."""
    maquinas = session.exec(select(Maquina)).all()
    return [serializar_maquina(m, session) for m in maquinas]


@router.post("", response_model=MaquinaOut, status_code=status.HTTP_201_CREATED)
def crear_maquina(
    data: MaquinaCreate, session: Session = Depends(get_session)
) -> MaquinaOut:
    """RN-07: Alta de nueva maquinaria con su lista de repuestos a mantener."""
    existe = session.exec(
        select(Maquina).where(Maquina.codigo == data.codigo.strip())
    ).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una máquina con el código {data.codigo}",
        )

    nueva = Maquina(
        codigo=data.codigo.strip(),
        nombre=data.nombre or data.codigo.strip(),
        tipo=data.tipo,
        ejemplar=data.ejemplar,
        linea=data.linea,
        estado="operativa",
    )
    session.add(nueva)

    # Vincular repuestos a mantener si se enviaron
    for rep_cod in data.repuestosAMantener:
        rel = MaquinaRepuesto(
            maquina_codigo=nueva.codigo, repuesto_codigo=rep_cod.strip()
        )
        session.add(rel)

    session.commit()
    session.refresh(nueva)

    return serializar_maquina(nueva, session)


@router.get("/{codigo}", response_model=MaquinaOut)
def obtener_maquina(
    codigo: str, session: Session = Depends(get_session)
) -> MaquinaOut:
    """Detalle de una máquina por su código (QR/placa)."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )
    return serializar_maquina(maquina, session)
