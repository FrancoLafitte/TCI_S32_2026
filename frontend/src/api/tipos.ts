/** Tipos copiados a mano de components/schemas del contrato (docs/contrato/openapi.yaml). */

export type ErrorApi = { codigo: string; mensaje: string };
export type Urgencia = "normal" | "urgente";

export type Ubicacion = { codigo: string; descripcion?: string };

export type Repuesto = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  stockFisico: number;
  stockReservado: number;
  stockDisponible: number;
  umbralMinimo: number;
  precioUnitario?: number;
  ubicacion: Ubicacion;
  maquinasCompatibles?: string[];
};

export type EstadoMaquina = "operativa" | "en_pruebas" | "en_mantenimiento" | "fuera_de_servicio";
export type Maquina = {
  codigo: string;
  nombre?: string;
  tipo: string;
  ejemplar: string;
  linea?: string;
  estado: EstadoMaquina;
  repuestosAMantener?: string[];
};

export type LineaPedido = { repuestoCodigo: string; cantidad: number };
export type EstadoIncidencia = "abierta" | "en_reparacion" | "espera_repuesto" | "resuelta";
export type TipoFalla = "perdida_presion" | "ruido_anomalo" | "fuga_fluido" | "otro";

export type Incidencia = {
  id: number;
  maquinaCodigo: string;
  maquina?: { codigo: string; nombre: string; linea?: string };
  descripcion: string;
  tipoFalla?: TipoFalla;
  prioridad: Urgencia;
  fotos?: string[];
  repuestosEstimados?: LineaPedido[];
  estado: EstadoIncidencia;
  turno: "manana" | "tarde" | "noche";
  reportadaPor?: string;
  creadaEn: string;
};

export type AccionCorrectiva = "reemplazo_pieza" | "calibracion" | "ajuste_mecanico" | "limpieza" | "otro";
export type LineaUso = { id: number; reparacionId: number; repuestoCodigo: string; cantidad: number };
export type Reparacion = {
  id: number;
  incidenciaId: number;
  lineasUso: LineaUso[];
  iniciadaEn: string;
  cerradaEn?: string;
};
export type ResultadoLineaUso = { lineaUso: LineaUso; repuesto: Repuesto; alertaGenerada: boolean };

export type ItemListaCompras = {
  origen: "umbral" | "manual";
  repuestoCodigo: string;
  nombre: string;
  stockDisponible?: number;
  umbralMinimo?: number;
  cantidadSugerida?: number;
  precioUnitario?: number;
  urgencia?: Urgencia;
  motivo?: string;
};

export type PedidoCompra = {
  id: number;
  lineas: LineaPedido[];
  urgencia: Urgencia;
  estado: "pendiente" | "recibido" | "cancelado";
  creadoEn: string;
  montoEstimado?: number;
};

export type Reserva = {
  id: number;
  lineas: LineaPedido[];
  motivo: string;
  maquinaCodigo?: string;
  urgencia?: Urgencia;
  incidenciaId?: number;
  solicitadaPor?: string;
  creadaEn?: string;
  estado: "activa" | "liberada" | "ejecutada";
};

export type ResumenTablero = {
  totalRepuestos: number;
  repuestosBajoUmbral: number;
  incidenciasActivas: number;
  incidenciasUrgentes: number;
  reservasActivas: number;
  pedidosPendientes: number;
  pedidosUrgentes: number;
  ultimoIngreso?: { repuestoCodigo: string; nombre: string; cantidad: number; fecha: string };
};
