import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { haceCuanto } from "../../api/useApi";
import { useIncidencias } from "../../api/useIncidencias";
import type { Incidencia } from "../../api/tipos";
import { ChipIncidencia } from "./componentes";

type Filtro = "todas" | "urgentes" | "detenidas" | "espera";

export default function SeleccionarIncidencia() {
  const nav = useNavigate();
  const { incidencias, cargando, error } = useIncidencias();
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [elegida, setElegida] = useState<Incidencia | null>(null);

  const todas = incidencias.filter(
    (i) => i.estado !== "resuelta" && i.estado !== "en_cuarentena"
  );
  // Prism no filtra, así que filtramos en el navegador.
  const visibles = todas
    .filter((i) => {
      if (filtro === "urgentes") return i.prioridad === "urgente";
      if (filtro === "detenidas") return i.estado === "detenida";
      if (filtro === "espera") return i.estado === "espera_repuesto";
      return true;
    })
    .filter((i) => `${i.id} ${i.maquina?.nombre} ${i.maquina?.linea}`.toLowerCase().includes(texto.toLowerCase()));

  return (
    <Layout
      titulo="Seleccionar Incidencia"
      subtitulo="Paso 1 de 2 · Identificar avería"
      volver="/mantenimiento"
      pie={
        <button className="btn btn-primario btn-grande" disabled={!elegida} onClick={() => elegida && nav(`/reparar/${elegida.id}`)}>
          Continuar al reporte de arreglo →
          {elegida && <small>Seleccionada: #INC-{elegida.id} ({elegida.maquina?.nombre})</small>}
        </button>
      }
    >
      <input className="input" placeholder="🔍 Buscar por ID, máquina, línea…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="chips">
        <button className={`chip-btn ${filtro === "todas" ? "activa" : ""}`} onClick={() => setFiltro("todas")}>Todas {todas.length}</button>
        <button className={`chip-btn ${filtro === "urgentes" ? "activa" : ""}`} onClick={() => setFiltro("urgentes")}>
          Urgentes ({todas.filter((i) => i.prioridad === "urgente").length})
        </button>
        <button className={`chip-btn ${filtro === "detenidas" ? "activa" : ""}`} onClick={() => setFiltro("detenidas")}>
          Detenidas ({todas.filter((i) => i.estado === "detenida").length})
        </button>
        <button className={`chip-btn ${filtro === "espera" ? "activa" : ""}`} onClick={() => setFiltro("espera")}>Espera repuesto</button>
      </div>

      <Estado cargando={cargando} error={error} />
      <div className="lista">
        {visibles.map((i) => (
          <button
            key={i.id}
            className={`card tarjeta-sel borde-${i.estado === "detenida" ? "neutro" : i.prioridad === "urgente" ? "error" : "warn"} ${elegida?.id === i.id ? "seleccionada" : ""}`}
            style={
              i.estado === "detenida"
                ? { borderLeft: "5px solid #1e293b", background: "var(--superficie-baja)" }
                : undefined
            }
            onClick={() => setElegida(i)}
          >
            <div className="fila">
              <span className="chip chip-codigo">#INC-{i.id}</span>
              <ChipIncidencia inc={i} />
              <span className="check">{elegida?.id === i.id ? "✓" : ""}</span>
            </div>
            <strong className="h3">{i.maquina?.nombre ?? i.maquinaCodigo}</strong>
            <small className="muted">{i.maquina?.linea}</small>
            <p>{i.descripcion}</p>
            {i.repuestosEstimados?.length ? (
              <p className="aviso">🔧 Repuesto sugerido: <strong>{i.repuestosEstimados[0].repuestoCodigo}</strong></p>
            ) : null}
            <div className="fila muted">
              <small>👤 {i.reportadaPor ?? "—"}</small>
              <small>🕑 {haceCuanto(i.creadaEn)}</small>
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
}
