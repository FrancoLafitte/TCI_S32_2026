from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    Reserva,
    LineaReserva,
    Repuesto,
    MovimientoStock,
    utc_now,
)
from app.schemas import (
    ReservaOut,
    ReservaCreate,
    LineaPedidoSchema,
)

router = APIRouter(prefix="/reservas", tags=["Reservas"])


def serializar_reserva(res: Reserva, session: Session) -> ReservaOut:
    lineas = session.exec(
        select(LineaReserva).where(LineaReserva.reserva_id == res.id)
    ).all()

    return ReservaOut(
        id=res.id or 0,
        lineas=[
            LineaPedidoSchema(
                repuestoCodigo=l.repuesto_codigo, cantidad=l.cantidad
            )
            for l in lineas
        ],
        motivo=res.motivo,
        maquinaCodigo=res.maquina_codigo,
        urgencia=res.urgencia,
        incidenciaId=res.incidencia_id,
        solicitadaPor=res.solicitada_por,
        creadaEn=res.creada_en.isoformat(),
        estado=res.estado,
    )


@router.get("", response_model=List[ReservaOut])
def listar_reservas(
    session: Session = Depends(get_session),
) -> List[ReservaOut]:
    """RN-05: Lista de repuestos apartados para mantenimientos preventivos."""
    reservas = session.exec(
        select(Reserva).order_by(Reserva.creada_en.desc())
    ).all()
    return [serializar_reserva(r, session) for r in reservas]


@router.post("", response_model=ReservaOut, status_code=status.HTTP_201_CREATED)
def crear_reserva(
    data: ReservaCreate,
    session: Session = Depends(get_session),
) -> ReservaOut:
    """RN-05: Aparta repuestos para mantenimiento planificado."""
    # Validar disponibilidad antes de reservar
    for lin in data.lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == lin.repuestoCodigo.strip())
        ).first()
        if not r:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Repuesto {lin.repuestoCodigo} no encontrado",
            )
        if r.stock_disponible < lin.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para reservar {r.nombre}. Disponible: {r.stock_disponible}, solicitado: {lin.cantidad}",
            )

    nueva = Reserva(
        motivo=data.motivo,
        maquina_codigo=data.maquinaCodigo,
        urgencia=data.urgencia,
        incidencia_id=data.incidenciaId,
        solicitadaPor="mantenimiento",
        creada_en=utc_now(),
        estado="activa",
    )
    session.add(nueva)
    session.commit()
    session.refresh(nueva)

    for lin in data.lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == lin.repuestoCodigo.strip())
        ).first()
        if r:
            r.stock_reservado += lin.cantidad
            session.add(r)

            mov = MovimientoStock(
                repuesto_codigo=r.codigo,
                tipo="reserva",
                cantidad=lin.cantidad,
                fecha=utc_now(),
                usuario="mantenimiento",
                referencia_tipo="reserva",
                referencia_id=nueva.id,
            )
            session.add(mov)

        l = LineaReserva(
            reserva_id=nueva.id or 0,
            repuesto_codigo=lin.repuestoCodigo.strip(),
            cantidad=lin.cantidad,
        )
        session.add(l)

    session.commit()
    session.refresh(nueva)
    return serializar_reserva(nueva, session)


@router.post("/{id}/liberacion", response_model=ReservaOut)
def liberar_reserva(
    id: int,
    session: Session = Depends(get_session),
) -> ReservaOut:
    """RN-05: Autorización de Encargado para liberar reserva."""
    reserva = session.exec(select(Reserva).where(Reserva.id == id)).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva #{id} no encontrada",
        )

    if reserva.estado != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La reserva ya está {reserva.estado}",
        )

    lineas = session.exec(
        select(LineaReserva).where(LineaReserva.reserva_id == reserva.id)
    ).all()

    for l in lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == l.repuesto_codigo)
        ).first()
        if r:
            r.stock_reservado = max(0, r.stock_reservado - l.cantidad)
            session.add(r)

            mov = MovimientoStock(
                repuesto_codigo=r.codigo,
                tipo="liberacion",
                cantidad=l.cantidad,
                fecha=utc_now(),
                usuario="encargado",
                referencia_tipo="reserva",
                referencia_id=reserva.id,
            )
            session.add(mov)

    reserva.estado = "liberada"
    session.add(reserva)
    session.commit()
    session.refresh(reserva)

    return serializar_reserva(reserva, session)


@router.post("/{id}/ejecucion", response_model=ReservaOut)
def ejecutar_reserva(
    id: int,
    session: Session = Depends(get_session),
) -> ReservaOut:
    """RN-10: Ejecutar mantenimiento descuenta stock físico y libera reserva en la misma transacción."""
    reserva = session.exec(select(Reserva).where(Reserva.id == id)).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva #{id} no encontrada",
        )

    if reserva.estado != "activa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La reserva ya está {reserva.estado}",
        )

    lineas = session.exec(
        select(LineaReserva).where(LineaReserva.reserva_id == reserva.id)
    ).all()

    for l in lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == l.repuesto_codigo)
        ).first()
        if r:
            r.stock_fisico = max(0, r.stock_fisico - l.cantidad)
            r.stock_reservado = max(0, r.stock_reservado - l.cantidad)
            session.add(r)

            mov = MovimientoStock(
                repuesto_codigo=r.codigo,
                tipo="consumo",
                cantidad=l.cantidad,
                fecha=utc_now(),
                usuario="mantenimiento",
                referencia_tipo="reserva",
                referencia_id=reserva.id,
            )
            session.add(mov)

    reserva.estado = "ejecutada"
    session.add(reserva)
    session.commit()
    session.refresh(reserva)

    return serializar_reserva(reserva, session)
