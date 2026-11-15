from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Maquina, MaquinaRepuesto, Repuesto
from app.schemas import (
    MaquinaOut,
    MaquinaCreate,
    MaquinaUpdate,
    RepuestoOut,
    VincularRepuestoSchema,
)
from app.routers.repuestos import serializar_repuesto

router = APIRouter(prefix="/maquinas", tags=["Maquinas"])

ESTADOS_VALIDOS = {"operativa", "en_pruebas", "en_mantenimiento", "fuera_de_servicio"}


def requerir_encargado(
    authorization: Optional[str] = Header(None),
    x_rol: Optional[str] = Header(None),
) -> str:
    """Verifica que el usuario tenga el rol de Encargado (o lanza 403 Forbidden)."""
    rol = None
    if x_rol:
        rol = x_rol.strip().lower()
    elif authorization:
        val = authorization.strip().lower()
        if "encargado" in val:
            rol = "encargado"
        elif "operario" in val:
            rol = "operario"
        elif "mantenimiento" in val:
            rol = "mantenimiento"
        elif "gerencia" in val:
            rol = "gerencia"

    if rol != "encargado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación restringida exclusivamente al rol Encargado de Mantenimiento.",
        )
    return rol


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
    """Devuelve el parque de maquinaria de la planta. Roles: todos."""
    maquinas = session.exec(select(Maquina)).all()
    return [serializar_maquina(m, session) for m in maquinas]


@router.post("", response_model=MaquinaOut, status_code=status.HTTP_201_CREATED)
def crear_maquina(
    data: MaquinaCreate,
    session: Session = Depends(get_session),
    _rol: str = Depends(requerir_encargado),
) -> MaquinaOut:
    """RN-07: Alta de nueva maquinaria con su lista de repuestos a mantener. Roles: Encargado."""
    codigo_limpio = data.codigo.strip()
    existe = session.exec(
        select(Maquina).where(Maquina.codigo == codigo_limpio)
    ).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una máquina con el código {codigo_limpio}",
        )

    estado_inicial = (data.estado or "operativa").strip().lower()
    if estado_inicial not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado '{estado_inicial}' inválido. Válidos: {', '.join(sorted(ESTADOS_VALIDOS))}",
        )

    nombre_asignado = (
        data.nombre.strip()
        if data.nombre and data.nombre.strip()
        else f"{data.tipo} {data.ejemplar}".strip() or codigo_limpio
    )

    nueva = Maquina(
        codigo=codigo_limpio,
        nombre=nombre_asignado,
        tipo=data.tipo.strip(),
        ejemplar=data.ejemplar.strip(),
        linea=data.linea.strip() if data.linea else None,
        estado=estado_inicial,
    )
    session.add(nueva)

    # Vincular repuestos a mantener si se enviaron
    repuestos_unicos = set(r.strip() for r in data.repuestosAMantener if r.strip())
    for rep_cod in repuestos_unicos:
        rel = MaquinaRepuesto(
            maquina_codigo=nueva.codigo, repuesto_codigo=rep_cod
        )
        session.add(rel)

    session.commit()
    session.refresh(nueva)

    return serializar_maquina(nueva, session)


@router.get("/{codigo}", response_model=MaquinaOut)
def obtener_maquina(
    codigo: str, session: Session = Depends(get_session)
) -> MaquinaOut:
    """Detalle de una máquina por su código (QR/placa). Roles: todos."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )
    return serializar_maquina(maquina, session)


@router.get("/{codigo}/repuestos", response_model=List[RepuestoOut])
def obtener_repuestos_de_maquina(
    codigo: str, session: Session = Depends(get_session)
) -> List[RepuestoOut]:
    """Lista detallada de repuestos vinculados a una máquina específica."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )

    relaciones = session.exec(
        select(MaquinaRepuesto.repuesto_codigo).where(
            MaquinaRepuesto.maquina_codigo == maquina.codigo
        )
    ).all()

    if not relaciones:
        return []

    repuestos = session.exec(
        select(Repuesto).where(Repuesto.codigo.in_(relaciones))
    ).all()

    return [serializar_repuesto(r, session) for r in repuestos]


@router.patch("/{codigo}", response_model=MaquinaOut)
def actualizar_maquina(
    codigo: str,
    data: MaquinaUpdate,
    session: Session = Depends(get_session),
    _rol: str = Depends(requerir_encargado),
) -> MaquinaOut:
    """Actualiza datos, estado operativo o repuestos asociados de una máquina. Roles: Encargado."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )

    if data.nombre is not None:
        maquina.nombre = data.nombre.strip()
    if data.tipo is not None:
        maquina.tipo = data.tipo.strip()
    if data.ejemplar is not None:
        maquina.ejemplar = data.ejemplar.strip()
    if data.linea is not None:
        maquina.linea = data.linea.strip() if data.linea.strip() else None

    if data.estado is not None:
        estado_limpio = data.estado.strip().lower()
        if estado_limpio not in ESTADOS_VALIDOS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado '{estado_limpio}' inválido. Válidos: {', '.join(sorted(ESTADOS_VALIDOS))}",
            )
        maquina.estado = estado_limpio

    if data.repuestosAMantener is not None:
        # Reemplazar lista completa de repuestos vinculados
        actuales = session.exec(
            select(MaquinaRepuesto).where(
                MaquinaRepuesto.maquina_codigo == maquina.codigo
            )
        ).all()
        for rel in actuales:
            session.delete(rel)

        repuestos_unicos = set(r.strip() for r in data.repuestosAMantener if r.strip())
        for rep_cod in repuestos_unicos:
            session.add(
                MaquinaRepuesto(
                    maquina_codigo=maquina.codigo, repuesto_codigo=rep_cod
                )
            )

    session.add(maquina)
    session.commit()
    session.refresh(maquina)

    return serializar_maquina(maquina, session)


@router.post("/{codigo}/repuestos", response_model=MaquinaOut)
def vincular_repuesto(
    codigo: str,
    data: VincularRepuestoSchema,
    session: Session = Depends(get_session),
    _rol: str = Depends(requerir_encargado),
) -> MaquinaOut:
    """Vincula un repuesto a la máquina para mantener en stock (RN-07). Roles: Encargado."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )

    repuesto = session.exec(
        select(Repuesto).where(Repuesto.codigo == data.repuestoCodigo.strip())
    ).first()
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el repuesto {data.repuestoCodigo}",
        )

    rel_existente = session.exec(
        select(MaquinaRepuesto).where(
            MaquinaRepuesto.maquina_codigo == maquina.codigo,
            MaquinaRepuesto.repuesto_codigo == repuesto.codigo,
        )
    ).first()

    if not rel_existente:
        session.add(
            MaquinaRepuesto(
                maquina_codigo=maquina.codigo, repuesto_codigo=repuesto.codigo
            )
        )
        session.commit()

    return serializar_maquina(maquina, session)


@router.delete("/{codigo}/repuestos/{repuesto_codigo}", response_model=MaquinaOut)
def desvincular_repuesto(
    codigo: str,
    repuesto_codigo: str,
    session: Session = Depends(get_session),
    _rol: str = Depends(requerir_encargado),
) -> MaquinaOut:
    """Quita un repuesto de la lista a mantener para la máquina. Roles: Encargado."""
    maquina = session.exec(
        select(Maquina).where(Maquina.codigo == codigo.strip())
    ).first()
    if not maquina:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró la máquina {codigo}",
        )

    rel = session.exec(
        select(MaquinaRepuesto).where(
            MaquinaRepuesto.maquina_codigo == maquina.codigo,
            MaquinaRepuesto.repuesto_codigo == repuesto_codigo.strip(),
        )
    ).first()

    if rel:
        session.delete(rel)
        session.commit()

    return serializar_maquina(maquina, session)
