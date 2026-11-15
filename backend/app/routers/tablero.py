from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.database import get_session
from app.models import (
    Repuesto,
    Incidencia,
    Reserva,
    PedidoCompra,
    MovimientoStock,
)
from app.schemas import ResumenTableroOut

router = APIRouter(prefix="/tablero", tags=["Tablero"])


@router.get("/resumen", response_model=ResumenTableroOut)
def obtener_resumen_tablero(
    session: Session = Depends(get_session),
) -> ResumenTableroOut:
    """Calcula los indicadores operativos en tiempo real para gerencia y mantenimiento."""
    repuestos = session.exec(select(Repuesto)).all()
    total_repuestos = len(repuestos)
    repuestos_bajo_umbral = sum(1 for r in repuestos if r.esta_bajo_umbral)

    incidencias = session.exec(select(Incidencia)).all()
    incidencias_activas = sum(1 for i in incidencias if i.estado in ["abierta", "en_reparacion", "espera_repuesto"])
    incidencias_urgentes = sum(
        1
        for i in incidencias
        if i.estado in ["abierta", "en_reparacion", "espera_repuesto"]
        and i.prioridad == "urgente"
    )

    reservas = session.exec(select(Reserva)).all()
    reservas_activas = sum(1 for r in reservas if r.estado == "activa")

    pedidos = session.exec(select(PedidoCompra)).all()
    pedidos_pendientes = sum(1 for p in pedidos if p.estado == "pendiente")
    pedidos_urgentes = sum(
        1 for p in pedidos if p.estado == "pendiente" and p.urgencia == "urgente"
    )

    # Último ingreso registrado
    ultimo_mov = session.exec(
        select(MovimientoStock)
        .where(MovimientoStock.tipo == "entrada")
        .order_by(MovimientoStock.fecha.desc())
    ).first()

    ultimo_ingreso = None
    if ultimo_mov:
        rep = session.exec(
            select(Repuesto).where(Repuesto.codigo == ultimo_mov.repuesto_codigo)
        ).first()
        ultimo_ingreso = {
            "repuestoCodigo": ultimo_mov.repuesto_codigo,
            "nombre": rep.nombre if rep else ultimo_mov.repuesto_codigo,
            "cantidad": ultimo_mov.cantidad,
            "fecha": ultimo_mov.fecha.isoformat(),
        }

    return ResumenTableroOut(
        totalRepuestos=total_repuestos,
        repuestosBajoUmbral=repuestos_bajo_umbral,
        incidenciasActivas=incidencias_activas,
        incidenciasUrgentes=incidencias_urgentes,
        reservasActivas=reservas_activas,
        pedidosPendientes=pedidos_pendientes,
        pedidosUrgentes=pedidos_urgentes,
        ultimoIngreso=ultimo_ingreso,
    )
