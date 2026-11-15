from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import (
    PedidoCompra,
    LineaPedidoCompra,
    Repuesto,
    RequerimientoManual,
    Alerta,
    MovimientoStock,
    utc_now,
)
from app.schemas import (
    PedidoCompraOut,
    PedidoCompraCreate,
    LineaPedidoSchema,
    ItemListaComprasOut,
    RequerimientoManualCreate,
    AlertaOut,
)

router = APIRouter(tags=["Compras"])


# ==========================================
# LISTA DE COMPRAS (VISTA DERIVADA)
# ==========================================
@router.get("/lista-compras", response_model=List[ItemListaComprasOut])
def obtener_lista_compras(
    session: Session = Depends(get_session),
) -> List[ItemListaComprasOut]:
    """Decisión de cátedra: Vista derivada de repuestos bajo umbral + requerimientos manuales."""
    items: List[ItemListaComprasOut] = []

    # 1. Repuestos con stock disponible <= umbral mínimo (RN-02)
    repuestos = session.exec(select(Repuesto)).all()
    for r in repuestos:
        if r.esta_bajo_umbral:
            sugerida = max(1, (r.umbral_minimo * 2) - r.stock_disponible)
            urgencia = "urgente" if r.stock_disponible == 0 else "normal"
            items.append(
                ItemListaComprasOut(
                    origen="umbral",
                    repuestoCodigo=r.codigo,
                    nombre=r.nombre,
                    stockDisponible=r.stock_disponible,
                    umbralMinimo=r.umbral_minimo,
                    cantidadSugerida=sugerida,
                    precioUnitario=r.precio_unitario,
                    urgencia=urgencia,
                    motivo=f"Stock bajo umbral (Disponible: {r.stock_disponible}, Mín: {r.umbral_minimo})",
                )
            )

    # 2. Requerimientos manuales agregados por el encargado
    manuales = session.exec(select(RequerimientoManual)).all()
    for req in manuales:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == req.repuesto_codigo)
        ).first()
        items.append(
            ItemListaComprasOut(
                origen="manual",
                repuestoCodigo=req.repuesto_codigo,
                nombre=r.nombre if r else req.repuesto_codigo,
                stockDisponible=r.stock_disponible if r else 0,
                umbralMinimo=r.umbral_minimo if r else 0,
                cantidadSugerida=req.cantidad_sugerida,
                precioUnitario=r.precio_unitario if r else 0.0,
                urgencia="normal",
                motivo=req.motivo or "Requerimiento manual agregado por encargado",
            )
        )

    return items


@router.post(
    "/lista-compras/requerimientos", status_code=status.HTTP_201_CREATED
)
def agregar_requerimiento_manual(
    data: RequerimientoManualCreate,
    session: Session = Depends(get_session),
) -> dict:
    """Permite al encargado sumar un repuesto manualmente a la lista de compras."""
    r = session.exec(
        select(Repuesto).where(Repuesto.codigo == data.repuestoCodigo.strip())
    ).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el repuesto {data.repuestoCodigo}",
        )

    nuevo = RequerimientoManual(
        repuesto_codigo=r.codigo,
        cantidad_sugerida=data.cantidadSugerida,
        motivo=data.motivo,
        creado_en=utc_now(),
    )
    session.add(nuevo)
    session.commit()
    return {"status": "ok", "mensaje": "Requerimiento agregado a la lista"}


# ==========================================
# ALERTAS
# ==========================================
@router.get("/alertas", response_model=List[AlertaOut])
def listar_alertas(
    session: Session = Depends(get_session),
) -> List[AlertaOut]:
    """RN-02: Alertas automáticas cuando el stock disponible llega a su umbral."""
    alertas = session.exec(
        select(Alerta).where(Alerta.resuelta == False).order_by(Alerta.generada_en.desc())
    ).all()
    return [
        AlertaOut(
            id=a.id or 0,
            repuestoCodigo=a.repuesto_codigo,
            stockDisponible=a.stock_disponible,
            umbralMinimo=a.umbral_minimo,
            generadaEn=a.generada_en.isoformat(),
        )
        for a in alertas
    ]


# ==========================================
# PEDIDOS DE COMPRA
# ==========================================
def serializar_pedido(pedido: PedidoCompra, session: Session) -> PedidoCompraOut:
    lineas = session.exec(
        select(LineaPedidoCompra).where(LineaPedidoCompra.pedido_id == pedido.id)
    ).all()

    return PedidoCompraOut(
        id=pedido.id or 0,
        lineas=[
            LineaPedidoSchema(
                repuestoCodigo=l.repuesto_codigo, cantidad=l.cantidad
            )
            for l in lineas
        ],
        urgencia=pedido.urgencia,
        estado=pedido.estado,
        creadoEn=pedido.creado_en.isoformat(),
        montoEstimado=pedido.monto_estimado,
    )


@router.get("/pedidos-compra", response_model=List[PedidoCompraOut])
def listar_pedidos_compra(
    session: Session = Depends(get_session),
) -> List[PedidoCompraOut]:
    """RN-04: Lista de pedidos de compra con grado de urgencia."""
    pedidos = session.exec(
        select(PedidoCompra).order_by(PedidoCompra.creado_en.desc())
    ).all()
    return [serializar_pedido(p, session) for p in pedidos]


@router.post(
    "/pedidos-compra",
    response_model=PedidoCompraOut,
    status_code=status.HTTP_201_CREATED,
)
def crear_pedido_compra(
    data: PedidoCompraCreate,
    session: Session = Depends(get_session),
) -> PedidoCompraOut:
    """RN-03 y RN-04: Genera un nuevo pedido de reposición con su grado de urgencia."""
    monto_total = 0.0

    nuevo = PedidoCompra(
        urgencia=data.urgencia,
        estado="pendiente",
        creado_en=utc_now(),
        monto_estimado=0.0,
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)

    for lin in data.lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == lin.repuestoCodigo.strip())
        ).first()
        if r:
            monto_total += r.precio_unitario * lin.cantidad

        l = LineaPedidoCompra(
            pedido_id=nuevo.id or 0,
            repuesto_codigo=lin.repuestoCodigo.strip(),
            cantidad=lin.cantidad,
        )
        session.add(l)

    nuevo.monto_estimado = monto_total
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)

    return serializar_pedido(nuevo, session)


@router.post("/pedidos-compra/{id}/recepcion")
def recepcionar_pedido(
    id: int,
    session: Session = Depends(get_session),
) -> dict:
    """RN-08: Recepción de compra e ingreso al stock físico."""
    pedido = session.exec(
        select(PedidoCompra).where(PedidoCompra.id == id)
    ).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido #{id} no encontrado",
        )

    lineas = session.exec(
        select(LineaPedidoCompra).where(LineaPedidoCompra.pedido_id == pedido.id)
    ).all()

    for l in lineas:
        r = session.exec(
            select(Repuesto).where(Repuesto.codigo == l.repuesto_codigo)
        ).first()
        if r:
            r.stock_fisico += l.cantidad
            session.add(r)

            mov = MovimientoStock(
                repuesto_codigo=r.codigo,
                tipo="entrada",
                cantidad=l.cantidad,
                fecha=utc_now(),
                usuario="encargado",
                referencia_tipo="pedido_compra",
                referencia_id=pedido.id,
            )
            session.add(mov)

    pedido.estado = "recibido"
    session.add(pedido)
    session.commit()

    return {"status": "ok", "mensaje": f"Pedido #{id} recibido y stock cargado"}
