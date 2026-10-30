import { haceCuanto } from "../../api/useApi";
import type { Incidencia } from "../../api/tipos";

export function ChipIncidencia({ inc }: { inc: Incidencia }) {
  if (inc.estado === "espera_repuesto") return <span className="chip chip-warn">En espera repuesto</span>;
  if (inc.prioridad === "urgente") return <span className="chip chip-error">Urgente</span>;
  return <span className="chip">Normal</span>;
}

export function TarjetaIncidenciaCorta({ inc }: { inc: Incidencia }) {
  return (
    <div className={`card card-link borde-${inc.prioridad === "urgente" ? "error" : inc.estado === "espera_repuesto" ? "warn" : "neutro"}`}>
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
