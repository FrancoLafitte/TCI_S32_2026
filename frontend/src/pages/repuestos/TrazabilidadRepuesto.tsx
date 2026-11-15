import { useParams } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { haceCuanto, useApi } from "../../api/useApi";
import type { MovimientoStock, Repuesto } from "../../api/tipos";

export default function TrazabilidadRepuesto() {
  const { codigo } = useParams<{ codigo: string }>();

  const repuestoApi = useApi<Repuesto>(`/repuestos/${encodeURIComponent(codigo ?? "")}`);
  const movimientosApi = useApi<MovimientoStock[]>(`/repuestos/${encodeURIComponent(codigo ?? "")}/movimientos`);

  const repuesto = repuestoApi.data;
  const movimientos = movimientosApi.data ?? [];

  const cargando = repuestoApi.cargando || movimientosApi.cargando;
  const error = repuestoApi.error || movimientosApi.error;

  function renderIconoTipo(tipo: MovimientoStock["tipo"]) {
    switch (tipo) {
      case "entrada":
        return { texto: "Entrada / Recepción", clase: "chip-ok", signo: "+" };
      case "consumo":
        return { texto: "Consumo en Reparación", clase: "chip-error", signo: "−" };
      case "reserva":
        return { texto: "Apartado / Reserva", clase: "chip-warn", signo: "−" };
      case "liberacion":
        return { texto: "Liberación de Reserva", clase: "chip", signo: "+" };
      default:
        return { texto: tipo, clase: "chip", signo: "" };
    }
  }

  return (
    <Layout
      titulo="Trazabilidad de Repuesto"
      subtitulo={`Historial completo · ${codigo}`}
      volver="/repuestos/buscar"
    >
      <Estado cargando={cargando} error={error} />

      {repuesto && (
        <section className="card borde-ok">
          <div className="fila" style={{ justifyContent: "space-between" }}>
            <span className="chip chip-codigo">{repuesto.codigo}</span>
            <span className="chip chip-ok">Stock: {repuesto.stockDisponible} uds</span>
          </div>
          <strong className="h3">{repuesto.nombre}</strong>
          {repuesto.descripcion && <p className="muted" style={{ margin: "0.2rem 0" }}>{repuesto.descripcion}</p>}

          <div className="fila" style={{ marginTop: "0.5rem" }}>
            <small className="muted">
              Ubicación: <strong>{repuesto.ubicacion.descripcion ?? repuesto.ubicacion.codigo}</strong>
            </small>
            <small className="muted">
              Umbral mínimo: <strong>{repuesto.umbralMinimo} uds</strong>
            </small>
          </div>
        </section>
      )}

      <div className="fila-titulo" style={{ marginTop: "0.5rem" }}>
        <h2 className="h2">Línea de tiempo (RN-06)</h2>
        <span className="muted">{movimientos.length} eventos</span>
      </div>

      {movimientos.length === 0 && !cargando && (
        <p className="muted center" style={{ marginTop: "2rem" }}>
          No hay movimientos registrados para este repuesto.
        </p>
      )}

      <div className="lista">
        {movimientos.map((m) => {
          const info = renderIconoTipo(m.tipo);
          return (
            <div
              key={m.id}
              className="card"
              style={{
                borderLeft:
                  m.tipo === "entrada"
                    ? "4px solid var(--ok)"
                    : m.tipo === "consumo"
                    ? "4px solid var(--error)"
                    : "4px solid var(--warn)",
              }}
            >
              <div className="fila" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className={`chip ${info.clase}`}>{info.texto}</span>
                <strong
                  style={{
                    fontSize: "1.1rem",
                    color: m.tipo === "entrada" ? "var(--ok)" : "var(--error)",
                  }}
                >
                  {info.signo}{m.cantidad} uds
                </strong>
              </div>

              {m.lote && (
                <div style={{ marginTop: "0.4rem", fontSize: "0.85rem" }}>
                  <strong>Lote fabricante:</strong> <span className="chip chip-codigo">{m.lote}</span>
                </div>
              )}

              {m.referencia && (
                <div style={{ fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  <strong>Referencia:</strong> {m.referencia.tipo === "reparacion" ? `Reparación #${m.referencia.id}` : `${m.referencia.tipo} #${m.referencia.id}`}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.5rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid var(--superficie-alta)",
                  fontSize: "0.75rem",
                  color: "var(--texto-suave)",
                }}
              >
                <span>Operador: {m.usuario}</span>
                <span>{haceCuanto(m.fecha)} ({new Date(m.fecha).toLocaleDateString("es-AR")})</span>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
