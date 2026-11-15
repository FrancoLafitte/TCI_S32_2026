"""Esquemas Pydantic que respetan el contrato OpenAPI (camelCase)."""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class UbicacionSchema(BaseModel):
    codigo: str
    descripcion: Optional[str] = None


class RepuestoOut(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    stockFisico: int
    stockReservado: int
    stockDisponible: int
    umbralMinimo: int
    precioUnitario: Optional[float] = 0.0
    ubicacion: UbicacionSchema
    maquinasCompatibles: List[str] = []


class RepuestoCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    umbralMinimo: int = 0
    precioUnitario: Optional[float] = 0.0
    ubicacion: UbicacionSchema


class IngresoCreate(BaseModel):
    cantidad: int = Field(ge=1)
    lote: Optional[str] = None
    ubicacion: Optional[UbicacionSchema] = None


class MovimientoStockOut(BaseModel):
    id: int
    tipo: str
    cantidad: int
    fecha: str
    usuario: str
    lote: Optional[str] = None
    referencia: Optional[dict] = None


class MaquinaOut(BaseModel):
    codigo: str
    nombre: Optional[str] = None
    tipo: str
    ejemplar: str
    linea: Optional[str] = None
    estado: str
    repuestosAMantener: List[str] = []


class MaquinaCreate(BaseModel):
    codigo: str
    nombre: Optional[str] = None
    tipo: str
    ejemplar: str
    linea: Optional[str] = None
    repuestosAMantener: List[str] = []


class MaquinaResumen(BaseModel):
    codigo: str
    nombre: str
    linea: Optional[str] = None


class IncidenciaOut(BaseModel):
    id: int
    maquinaCodigo: str
    maquina: Optional[MaquinaResumen] = None
    descripcion: str
    tipoFalla: Optional[str] = None
    prioridad: str
    fotos: List[str] = []
    repuestosEstimados: List[dict] = []
    estado: str
    turno: str
    reportadaPor: Optional[str] = None
    creadaEn: str


class IncidenciaCreate(BaseModel):
    maquinaCodigo: str
    descripcion: str
    prioridad: str = "normal"
    tipoFalla: Optional[str] = None
    fotos: List[str] = []


class LineaUsoCreate(BaseModel):
    repuestoCodigo: str
    cantidad: int = Field(ge=1)


class LineaUsoOut(BaseModel):
    id: int
    reparacionId: int
    repuestoCodigo: str
    cantidad: int


class ResultadoLineaUsoOut(BaseModel):
    lineaUso: LineaUsoOut
    repuesto: RepuestoOut
    alertaGenerada: bool


class CierreReparacion(BaseModel):
    minutosIntervencion: int
    accionCorrectiva: str
    notas: Optional[str] = None
    estadoMaquina: str = "operativa"


class ReparacionOut(BaseModel):
    id: int
    incidenciaId: int
    lineasUso: List[LineaUsoOut] = []
    iniciadaEn: str
    cerradaEn: Optional[str] = None
    minutosIntervencion: Optional[int] = None
    accionCorrectiva: Optional[str] = None
    notas: Optional[str] = None
    estadoMaquina: Optional[str] = None


class LineaPedidoSchema(BaseModel):
    repuestoCodigo: str
    cantidad: int = Field(ge=1)


class PedidoCompraOut(BaseModel):
    id: int
    lineas: List[LineaPedidoSchema]
    urgencia: str
    estado: str
    creadoEn: str
    montoEstimado: Optional[float] = 0.0


class PedidoCompraCreate(BaseModel):
    urgencia: str = "normal"
    lineas: List[LineaPedidoSchema]


class ReservaOut(BaseModel):
    id: int
    lineas: List[LineaPedidoSchema]
    motivo: str
    maquinaCodigo: Optional[str] = None
    urgencia: Optional[str] = "normal"
    incidenciaId: Optional[int] = None
    solicitadaPor: Optional[str] = None
    creadaEn: Optional[str] = None
    estado: str


class ReservaCreate(BaseModel):
    motivo: str
    maquinaCodigo: Optional[str] = None
    urgencia: str = "normal"
    incidenciaId: Optional[int] = None
    lineas: List[LineaPedidoSchema]


class ItemListaComprasOut(BaseModel):
    origen: Literal["umbral", "manual"]
    repuestoCodigo: str
    nombre: str
    stockDisponible: int
    umbralMinimo: int
    cantidadSugerida: int
    precioUnitario: float
    urgencia: str
    motivo: Optional[str] = None


class RequerimientoManualCreate(BaseModel):
    repuestoCodigo: str
    cantidadSugerida: int = Field(ge=1)
    motivo: Optional[str] = None


class AlertaOut(BaseModel):
    id: int
    repuestoCodigo: str
    stockDisponible: int
    umbralMinimo: int
    generadaEn: str


class ResumenTableroOut(BaseModel):
    totalRepuestos: int
    repuestosBajoUmbral: int
    incidenciasActivas: int
    incidenciasUrgentes: int
    reservasActivas: int
    pedidosPendientes: int
    pedidosUrgentes: int
    ultimoIngreso: Optional[dict] = None
