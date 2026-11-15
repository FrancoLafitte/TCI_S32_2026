from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    Reparacion,
    LineaUso,
    Repuesto,
    Incidencia,
    MovimientoStock,
    Alerta,
    utc_now,
)
from app.schemas import (
    ReparacionOut,
    LineaUsoCreate,
    LineaUsoOut,
    ResultadoLineaUsoOut,
    CierreReparacion,
)
from app.routers.repuestos import serializar_repuesto

router = APIRouter(prefix="/reparaciones", tags=["Reparaciones"])


def serializar_reparacion(rep: Reparacion, session: Session) -> ReparacionOut:
    lineas = session.exec(
        select(LineaUso).where(LineaUso.reparacion_id == rep.id)
    ).all()
    lineas_out = [
        LineaUsoOut(
            id=l.id or 0,
            reparacionId=l.reparacion_id,
            repuestoCodigo=l.repuesto_codigo,
            cantidad=l.cantidad,
        )
        for l in lineas
    ]

    return ReparacionOut(
        id=rep.id or 0,
        incidenciaId=rep.incidencia_id,
        lineasUso=lineas_out,
        iniciadaEn=rep.iniciada_en.isoformat(),
        cerradaEn=rep.cerrada_en.isoformat() if rep.cerrada_en else None,
        minutosIntervencion=rep.minutos_intervencion,
        accionCorrectiva=rep.accion_correctiva,
        notas=rep.notas,
        estadoMaquina=rep.estado_maquina,
    )


@router.get("", response_model=List[ReparacionOut])
def listar_reparaciones(
    session: Session = Depends(get_session),
) -> List[ReparacionOut]:
    """Lista las intervenciones técnicas de mantenimiento."""
    reparaciones = session.exec(select(Reparacion)).all()
    return [serializar_reparacion(r, session) for r in reparaciones]


@router.post("/{id}/lineas-uso", response_model=ResultadoLineaUsoOut)
def registrar_linea_uso(
    id: int,
    data: LineaUsoCreate,
    session: Session = Depends(get_session),
) -> ResultadoLineaUsoOut:
    """RN-01: Usar repuesto descuenta stock físico. RN-02: Genera alerta si stock <= umbral."""
    reparacion = session.exec(select(Reparacion).where(Reparacion.id == id)).first()
    if not reparacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reparación #{id} no encontrada",
        )

    repuesto = session.exec(
        select(Repuesto).where(Repuesto.codigo == data.repuestoCodigo.strip())
    ).first()
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repuesto {data.repuestoCodigo} no encontrado",
        )

    # RN-01: El stock físico resultante debe ser >= 0
    if repuesto.stock_fisico < data.cantidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock insuficiente. Stock físico actual: {repuesto.stock_fisico}, solicitado: {data.cantidad}",
        )

    # Descontamos el stock
    repuesto.stock_fisico -= data.cantidad

    # Registramos la línea de uso
    linea = LineaUso(
        reparacion_id=reparacion.id or 0,
        repuesto_codigo=repuesto.codigo,
        cantidad=data.cantidad,
    )
    session.add(linea)

    # RN-06: Movimiento inmutable tipo consumo
    mov = MovimientoStock(
        repuesto_codigo=repuesto.codigo,
        tipo="consumo",
        cantidad=data.cantidad,
        fecha=utc_now(),
        usuario="mantenimiento",
        referencia_tipo="reparacion",
        referencia_id=reparacion.id,
    )
    session.add(mov)

    # RN-02: Verificar si quedó bajo umbral y generar alerta
    alerta_generada = False
    if repuesto.esta_bajo_umbral:
        alerta_generada = True
        alerta = Alerta(
            repuesto_codigo=repuesto.codigo,
            stock_disponible=repuesto.stock_disponible,
            umbral_minimo=repuesto.umbral_minimo,
            generada_en=utc_now(),
        )
        session.add(alerta)

    session.add(repuesto)
    session.commit()
    session.refresh(linea)
    session.refresh(repuesto)

    return ResultadoLineaUsoOut(
        lineaUso=LineaUsoOut(
            id=linea.id or 0,
            reparacionId=linea.reparacion_id,
            repuestoCodigo=linea.repuesto_codigo,
            cantidad=linea.cantidad,
        ),
        repuesto=serializar_repuesto(repuesto, session),
        alertaGenerada=alerta_generada,
    )


@router.post("/{id}/cierre", response_model=ReparacionOut)
def cerrar_reparacion(
    id: int,
    data: CierreReparacion,
    session: Session = Depends(get_session),
) -> ReparacionOut:
    """Cierra la reparación técnica y actualiza el estado de la incidencia y la máquina."""
    rep = session.exec(select(Reparacion).where(Reparacion.id == id)).first()
    if not rep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reparación #{id} no encontrada",
        )

    rep.cerrada_en = utc_now()
    rep.minutos_intervencion = data.minutosIntervencion
    rep.accion_correctiva = data.accionCorrectiva
    rep.notas = data.notas
    rep.estado_maquina = data.estadoMaquina

    # Resolver la incidencia asociada
    incidencia = session.exec(
        select(Incidencia).where(Incidencia.id == rep.incidencia_id)
    ).first()
    if incidencia:
        incidencia.estado = "resuelta"
        session.add(incidencia)

    session.add(rep)
    session.commit()
    session.refresh(rep)

    return serializar_reparacion(rep, session)
