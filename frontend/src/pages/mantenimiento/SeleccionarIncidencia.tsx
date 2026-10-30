import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { haceCuanto, useApi } from "../../api/useApi";
import type { Incidencia } from "../../api/tipos";
import { ChipIncidencia } from "./componentes";

type Filtro = "todas" | "urgentes" | "espera";

export default function SeleccionarIncidencia() {
  const nav = useNavigate();
  const { data, cargando, error } = useApi<Incidencia[]>("/incidencias");
  const [texto, setTexto] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [elegida, setElegida] = useState<Incidencia | null>(null);

  const todas = (data ?? []).filter((i) => i.estado !== "resuelta");
  // Prism no filtra, así que filtramos en el navegador.
  const visibles = todas
    .filter((i) => filtro === "todas" || (filtro === "urgentes" ? i.prioridad === "urgente" : i.estado === "espera_repuesto"))
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
        <button className={`chip-btn ${filtro === "espera" ? "activa" : ""}`} onClick={() => setFiltro("espera")}>Espera repuesto</button>
      </div>

      <Estado cargando={cargando} error={error} />
      <div className="lista">
        {visibles.map((i) => (
          <button
            key={i.id}
            className={`card tarjeta-sel borde-${i.prioridad === "urgente" ? "error" : i.estado === "espera_repuesto" ? "warn" : "neutro"} ${elegida?.id === i.id ? "seleccionada" : ""}`}
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
