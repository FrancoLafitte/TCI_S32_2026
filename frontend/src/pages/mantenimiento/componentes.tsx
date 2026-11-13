import { haceCuanto } from "../../api/useApi";
import type { Incidencia } from "../../api/tipos";

export function ChipIncidencia({ inc }: { inc: Incidencia }) {
  if (inc.estado === "detenida") {
    return (
      <span
        className="chip"
        style={{
          background: "#1e293b",
          color: "#ffffff",
          border: "1px solid #475569",
        }}
      >
        Detenida / Parada
      </span>
    );
  }
  if (inc.estado === "espera_repuesto") return <span className="chip chip-warn">En espera repuesto</span>;
  if (inc.prioridad === "urgente") return <span className="chip chip-error">Urgente</span>;
  return <span className="chip chip-warn">Normal</span>;
}

export function TarjetaIncidenciaCorta({ inc }: { inc: Incidencia }) {
  const borde =
    inc.estado === "detenida"
      ? "neutro"
      : inc.prioridad === "urgente"
      ? "error"
      : "warn";

  return (
    <div
      className={`card card-link borde-${borde}`}
      style={
        inc.estado === "detenida"
          ? { borderLeft: "5px solid #1e293b", background: "var(--superficie-baja)" }
          : undefined
      }
    >
      <div>
        <strong>#INC-{inc.id} · {inc.maquina?.nombre ?? inc.maquinaCodigo}</strong>
        <small className="muted">{inc.descripcion}</small>
        <div className="fila">
          <ChipIncidencia inc={inc} />
          <small className="muted">{haceCuanto(inc.creadaEn)} · {inc.maquina?.linea}</small>
        </div>
      </div>
      <span>›</span>
    </div>
  );
}
