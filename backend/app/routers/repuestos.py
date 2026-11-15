from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Repuesto, MaquinaRepuesto, MovimientoStock, utc_now
from app.schemas import (
    RepuestoOut,
    RepuestoCreate,
    IngresoCreate,
    MovimientoStockOut,
    UbicacionSchema,
)

router = APIRouter(prefix="/repuestos", tags=["Repuestos"])


def serializar_repuesto(repuesto: Repuesto, session: Session) -> RepuestoOut:
    """Convierte un modelo Repuesto al schema OpenAPI con máquinas compatibles."""
    # Buscar máquinas compatibles
    statement = select(MaquinaRepuesto.maquina_codigo).where(
        MaquinaRepuesto.repuesto_codigo == repuesto.codigo
    )
    maquinas = session.exec(statement).all()

    return RepuestoOut(
        id=repuesto.id or 0,
        codigo=repuesto.codigo,
        nombre=repuesto.nombre,
        descripcion=repuesto.descripcion,
        stockFisico=repuesto.stock_fisico,
        stockReservado=repuesto.stock_reservado,
        stockDisponible=repuesto.stock_disponible,
        umbralMinimo=repuesto.umbral_minimo,
        precioUnitario=repuesto.precio_unitario,
        ubicacion=UbicacionSchema(
            codigo=repuesto.ubicacion_codigo,
            descripcion=repuesto.ubicacion_descripcion,
        ),
        maquinasCompatibles=list(maquinas),
    )


@router.get("", response_model=List[RepuestoOut])
def listar_repuestos(
    q: Optional[str] = Query(None, description="Búsqueda por código, nombre o máquina"),
    bajoUmbral: Optional[bool] = Query(None, description="Filtrar bajo umbral mínimo"),
    session: Session = Depends(get_session),
) -> List[RepuestoOut]:
    """Lista todos los repuestos con filtros opcionales de búsqueda y stock crítico."""
    repuestos = session.exec(select(Repuesto)).all()
    resultado = [serializar_repuesto(r, session) for r in repuestos]

    if q:
        termino = q.strip().lower()
        resultado = [
            r
            for r in resultado
            if termino in r.codigo.lower()
            or termino in r.nombre.lower()
            or any(termino in m.lower() for m in r.maquinasCompatibles)
        ]

    if bajoUmbral is not None and bajoUmbral:
        resultado = [r for r in resultado if r.stockDisponible <= r.umbralMinimo]

    return resultado


@router.post("", response_model=RepuestoOut, status_code=status.HTTP_201_CREATED)
def crear_repuesto(
    data: RepuestoCreate,
    session: Session = Depends(get_session),
) -> RepuestoOut:
    """Crea un nuevo repuesto en el almacén."""
    existe = session.exec(
        select(Repuesto).where(Repuesto.codigo == data.codigo.strip())
    ).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un repuesto con el código {data.codigo}",
        )

    nuevo = Repuesto(
        codigo=data.codigo.strip(),
        nombre=data.nombre.strip(),
        descripcion=data.descripcion,
        stock_fisico=0,
        stock_reservado=0,
        umbral_minimo=data.umbralMinimo,
        precio_unitario=data.precioUnitario or 0.0,
        ubicacion_codigo=data.ubicacion.codigo,
        ubicacion_descripcion=data.ubicacion.descripcion,
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)

    return serializar_repuesto(nuevo, session)


@router.get("/{codigo}", response_model=RepuestoOut)
def obtener_repuesto(
    codigo: str,
    session: Session = Depends(get_session),
) -> RepuestoOut:
    """Devuelve el detalle de un repuesto por su código único (QR/barras)."""
    repuesto = session.exec(
        select(Repuesto).where(Repuesto.codigo == codigo.strip())
    ).first()
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el repuesto con código {codigo}",
        )
    return serializar_repuesto(repuesto, session)


@router.post("/{codigo}/ingresos", status_code=status.HTTP_201_CREATED)
def registrar_ingreso(
    codigo: str,
    data: IngresoCreate,
    session: Session = Depends(get_session),
) -> dict:
    """RN-08: Registra ingreso de repuestos, incrementa stock físico y crea movimiento."""
    repuesto = session.exec(
        select(Repuesto).where(Repuesto.codigo == codigo.strip())
    ).first()
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el repuesto con código {codigo}",
        )

    repuesto.stock_fisico += data.cantidad
    if data.ubicacion and data.ubicacion.codigo:
        repuesto.ubicacion_codigo = data.ubicacion.codigo
        if data.ubicacion.descripcion:
            repuesto.ubicacion_descripcion = data.ubicacion.descripcion

    # Trazabilidad RN-06: Movimiento de stock inmutable tipo "entrada"
    mov = MovimientoStock(
        repuesto_codigo=repuesto.codigo,
        tipo="entrada",
        cantidad=data.cantidad,
        fecha=utc_now(),
        usuario="almacen",
        lote=data.lote,
        referencia_tipo="ingreso",
    )
    session.add(repuesto)
    session.add(mov)
    session.commit()

    return {
        "codigo": repuesto.codigo,
        "nombre": repuesto.nombre,
        "cantidadIngresada": data.cantidad,
        "stockFisico": repuesto.stock_fisico,
    }


@router.get("/{codigo}/movimientos", response_model=List[MovimientoStockOut])
def obtener_movimientos(
    codigo: str,
    session: Session = Depends(get_session),
) -> List[MovimientoStockOut]:
    """RN-06: Historial de movimientos inmutables para trazabilidad."""
    repuesto = session.exec(
        select(Repuesto).where(Repuesto.codigo == codigo.strip())
    ).first()
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el repuesto {codigo}",
        )

    movs = session.exec(
        select(MovimientoStock)
        .where(MovimientoStock.repuesto_codigo == codigo.strip())
        .order_by(MovimientoStock.fecha.desc())
    ).all()

    return [
        MovimientoStockOut(
            id=m.id or 0,
            tipo=m.tipo,
            cantidad=m.cantidad,
            fecha=m.fecha.isoformat(),
            usuario=m.usuario,
            lote=m.lote,
            referencia=(
                {"tipo": m.referencia_tipo, "id": m.referencia_id}
                if m.referencia_tipo
                else None
            ),
        )
        for m in movs
    ]
