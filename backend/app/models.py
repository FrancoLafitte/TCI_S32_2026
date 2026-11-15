from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship


def utc_now() -> datetime:
    """Devuelve la fecha y hora UTC actual con timezone."""
    return datetime.now(timezone.utc)


# ==========================================
# 1. USUARIOS Y AUTENTICACIÓN
# ==========================================
class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str
    nombre: str
    rol: str = Field(index=True)  # operario, mantenimiento, encargado, gerencia


# ==========================================
# 2. MÁQUINAS Y REPUESTOS COMPATIBLES
# ==========================================
class MaquinaRepuesto(SQLModel, table=True):
    __tablename__ = "maquinas_repuestos"

    maquina_codigo: str = Field(foreign_key="maquinas.codigo", primary_key=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo", primary_key=True)


class Maquina(SQLModel, table=True):
    __tablename__ = "maquinas"

    codigo: str = Field(primary_key=True, index=True)  # Ej: MAQ-F04
    nombre: str  # Ej: Fraccionador F-04
    tipo: str  # Ej: Fraccionador
    ejemplar: str  # Ej: F-04
    linea: Optional[str] = None  # Ej: Línea 2 - Envasado
    estado: str = Field(default="operativa")  # operativa, en_pruebas, en_mantenimiento, fuera_de_servicio


# ==========================================
# 3. REPUESTOS E INVENTARIO
# ==========================================
class Repuesto(SQLModel, table=True):
    __tablename__ = "repuestos"

    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True)  # Ej: REP-7742 (QR/código de barras)
    nombre: str
    descripcion: Optional[str] = None
    stock_fisico: int = Field(default=0, ge=0)
    stock_reservado: int = Field(default=0, ge=0)
    umbral_minimo: int = Field(default=0, ge=0)
    precio_unitario: float = Field(default=0.0, ge=0.0)
    ubicacion_codigo: str = Field(default="A-01-01")  # Ej: A-03-12
    ubicacion_descripcion: Optional[str] = None

    @property
    def stock_disponible(self) -> int:
        """RN-02: stockDisponible = stockFisico - stockReservado."""
        return max(0, self.stock_fisico - self.stock_reservado)

    @property
    def esta_bajo_umbral(self) -> bool:
        """RN-02: Se alerta cuando stockDisponible <= umbralMinimo."""
        return self.stock_disponible <= self.umbral_minimo


# ==========================================
# 4. MOVIMIENTOS DE STOCK (INMUTABLES)
# ==========================================
class MovimientoStock(SQLModel, table=True):
    __tablename__ = "movimientos_stock"

    id: Optional[int] = Field(default=None, primary_key=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo", index=True)
    tipo: str = Field(index=True)  # entrada, salida, reserva, liberacion, consumo
    cantidad: int = Field(gt=0)
    fecha: datetime = Field(default_factory=utc_now)
    usuario: str
    lote: Optional[str] = None
    referencia_tipo: Optional[str] = None  # pedido_compra, reparacion, reserva, ingreso
    referencia_id: Optional[int] = None


# ==========================================
# 5. INCIDENCIAS Y REPARACIONES
# ==========================================
class Incidencia(SQLModel, table=True):
    __tablename__ = "incidencias"

    id: Optional[int] = Field(default=None, primary_key=True)
    maquina_codigo: str = Field(foreign_key="maquinas.codigo", index=True)
    descripcion: str
    tipo_falla: Optional[str] = None  # perdida_presion, ruido_anomalo, fuga_fluido, otro
    prioridad: str = Field(default="normal")  # normal, urgente
    fotos: Optional[str] = None  # JSON string con URLs de fotos
    estado: str = Field(default="abierta")  # abierta, en_reparacion, espera_repuesto, resuelta
    turno: str = Field(default="manana")  # manana, tarde, noche
    reportada_por: str
    creada_en: datetime = Field(default_factory=utc_now)


class Reparacion(SQLModel, table=True):
    __tablename__ = "reparaciones"

    id: Optional[int] = Field(default=None, primary_key=True)
    incidencia_id: int = Field(foreign_key="incidencias.id", index=True)
    iniciada_en: datetime = Field(default_factory=utc_now)
    cerrada_en: Optional[datetime] = None
    minutos_intervencion: Optional[int] = None
    accion_correctiva: Optional[str] = None  # reemplazo_pieza, calibracion, ajuste_mecanico, limpieza, otro
    notas: Optional[str] = None
    estado_maquina: Optional[str] = None


class LineaUso(SQLModel, table=True):
    """RN-01: Uso de repuesto en reparación descuenta stock."""
    __tablename__ = "lineas_uso"

    id: Optional[int] = Field(default=None, primary_key=True)
    reparacion_id: int = Field(foreign_key="reparaciones.id", index=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo")
    cantidad: int = Field(gt=0)


# ==========================================
# 6. PEDIDOS DE COMPRA
# ==========================================
class PedidoCompra(SQLModel, table=True):
    __tablename__ = "pedidos_compra"

    id: Optional[int] = Field(default=None, primary_key=True)
    urgencia: str = Field(default="normal")  # normal, urgente
    estado: str = Field(default="pendiente")  # pendiente, recibido, cancelado
    creado_en: datetime = Field(default_factory=utc_now)
    monto_estimado: float = Field(default=0.0)


class LineaPedidoCompra(SQLModel, table=True):
    __tablename__ = "lineas_pedido_compra"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos_compra.id", index=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo")
    cantidad: int = Field(gt=0)


# ==========================================
# 7. RESERVAS DE STOCK
# ==========================================
class Reserva(SQLModel, table=True):
    """RN-05 y RN-10: Reserva para mantenimiento preventivo."""
    __tablename__ = "reservas"

    id: Optional[int] = Field(default=None, primary_key=True)
    motivo: str
    maquina_codigo: Optional[str] = Field(default=None, foreign_key="maquinas.codigo")
    urgencia: str = Field(default="normal")  # normal, urgente
    incidencia_id: Optional[int] = Field(default=None, foreign_key="incidencias.id")
    solicitada_por: str
    creada_en: datetime = Field(default_factory=utc_now)
    estado: str = Field(default="activa")  # activa, liberada, ejecutada


class LineaReserva(SQLModel, table=True):
    __tablename__ = "lineas_reserva"

    id: Optional[int] = Field(default=None, primary_key=True)
    reserva_id: int = Field(foreign_key="reservas.id", index=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo")
    cantidad: int = Field(gt=0)


# ==========================================
# 8. ALERTAS Y REQUERIMIENTOS MANUALES
# ==========================================
class Alerta(SQLModel, table=True):
    """RN-02: Generada cuando el stock disponible llega a su umbral."""
    __tablename__ = "alertas"

    id: Optional[int] = Field(default=None, primary_key=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo", index=True)
    stock_disponible: int
    umbral_minimo: int
    generada_en: datetime = Field(default_factory=utc_now)
    resuelta: bool = Field(default=False)


class RequerimientoManual(SQLModel, table=True):
    """Requerimiento manual agregado por el encargado a la lista de compras."""
    __tablename__ = "requerimientos_manuales"

    id: Optional[int] = Field(default=None, primary_key=True)
    repuesto_codigo: str = Field(foreign_key="repuestos.codigo", index=True)
    cantidad_sugerida: int = Field(gt=0)
    motivo: Optional[str] = None
    creado_en: datetime = Field(default_factory=utc_now)
