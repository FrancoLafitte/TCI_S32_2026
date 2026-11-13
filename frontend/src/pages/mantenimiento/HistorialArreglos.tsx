import { useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { useApi, haceCuanto } from "../../api/useApi";
import type { Incidencia } from "../../api/tipos";

interface ArregloHistorial {
  id: number;
  incidenciaId: number;
  maquina: string;
  fecha: string;
  accionCorrectiva: string;
  notas: string;
  estadoMaquina: string;
  repuestosUtilizados: Array<{ codigo: string; nombre: string; cantidad: number }>;
}

export default function HistorialArreglos() {
  const { data: incidencias, cargando, error } = useApi<Incidencia[]>("/incidencias");
  const [historialLocal] = useState<ArregloHistorial[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("historial_arreglos") ?? "[]");
    } catch {
      return [];
    }
  });

  // Incidencias marcadas como resueltas en el backend/mock
  const incidenciasResueltas = (incidencias ?? []).filter((i) => i.estado === "resuelta");

  return (
    <Layout titulo="Arreglos Realizados" subtitulo="Historial de reparaciones" volver="/mantenimiento">
      <div className="fila-titulo">
        <h2 className="h2">Historial de intervenciones</h2>
        <span className="muted">
          {historialLocal.length + incidenciasResueltas.length} registrados
        </span>
      </div>

      <Estado cargando={cargando} error={error} />

      {historialLocal.length === 0 && incidenciasResueltas.length === 0 && !cargando && (
        <p className="muted center" style={{ marginTop: "2rem" }}>
          No hay arreglos reportados todavía.
        </p>
      )}

      {/* Lista de arreglos cerrados recientemente */}
      <div className="lista">
        {historialLocal.map((arr) => (
          <article key={`local-${arr.id}`} className="card borde-ok">
            <div className="fila" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{arr.maquina}</strong>
                <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  Ref: #INC-{arr.incidenciaId}
                </span>
              </div>
              <span className="chip chip-ok" style={{ textTransform: "capitalize" }}>
                {arr.estadoMaquina}
              </span>
            </div>

            <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
              <strong>Acción:</strong> {arr.accionCorrectiva.replace("_", " ")}
              {arr.notas && <span className="muted"> — {arr.notas}</span>}
            </p>

            <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Repuestos:</strong>
              {arr.repuestosUtilizados.length === 0 ? (
                <span className="muted">Sin uso de repuestos.</span>
              ) : (
                <ul style={{ margin: "0.25rem 0", paddingLeft: "1.2rem" }}>
                  {arr.repuestosUtilizados.map((r, idx) => (
                    <li key={idx}>
                      {r.codigo} · {r.nombre} ({r.cantidad} u.)
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              style={{
                marginTop: "0.5rem",
                paddingTop: "0.4rem",
                borderTop: "1px solid var(--superficie-alta)",
                fontSize: "0.75rem",
                color: "var(--texto-suave)",
              }}
            >
              {haceCuanto(arr.fecha)}
            </div>
          </article>
        ))}

        {/* Resueltas que vienen del mock */}
        {incidenciasResueltas.map((inc) => (
          <article key={`mock-${inc.id}`} className="card borde-neutro">
            <div className="fila" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{inc.maquina?.nombre ?? inc.maquinaCodigo}</strong>
                <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  #INC-{inc.id}
                </span>
              </div>
              <span className="chip chip-ok">Resuelta</span>
            </div>
            <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>{inc.descripcion}</p>
            <div style={{ fontSize: "0.75rem", color: "var(--texto-suave)" }}>
              {haceCuanto(inc.creadaEn)} · Turno {inc.turno}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
}
