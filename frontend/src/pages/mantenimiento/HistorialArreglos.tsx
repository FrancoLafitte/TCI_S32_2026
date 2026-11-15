import { useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { useApi, haceCuanto } from "../../api/useApi";
import type { Reparacion } from "../../api/tipos";

export default function HistorialArreglos() {
  const { data: reparaciones, cargando, error } = useApi<Reparacion[]>("/reparaciones");
  const [paginaActual, setPaginaActual] = useState(1);

  const TAMANO_PAGINA = 5;

  // Reparaciones cerradas desde la base de datos, ordenadas de la más nueva a la más vieja
  const cerradasOrdenadas = (reparaciones ?? [])
    .filter((r) => r.cerradaEn)
    .sort((a, b) => {
      const fechaA = new Date(a.cerradaEn ?? a.iniciadaEn).getTime();
      const fechaB = new Date(b.cerradaEn ?? b.iniciadaEn).getTime();
      if (fechaB !== fechaA) return fechaB - fechaA;
      return b.id - a.id;
    });

  const totalPaginas = Math.ceil(cerradasOrdenadas.length / TAMANO_PAGINA) || 1;
  const inicio = (paginaActual - 1) * TAMANO_PAGINA;
  const lista = cerradasOrdenadas.slice(inicio, inicio + TAMANO_PAGINA);

  return (
    <Layout titulo="Arreglos Realizados" subtitulo="Historial de reparaciones" volver="/mantenimiento">
      <div className="fila-titulo">
        <h2 className="h2">Historial de intervenciones</h2>
        <span className="muted">{cerradasOrdenadas.length} registrados</span>
      </div>

      <Estado cargando={cargando} error={error} />

      {cerradasOrdenadas.length === 0 && !cargando && (
        <p className="muted center" style={{ marginTop: "2rem" }}>
          No hay arreglos cerrados todavía.
        </p>
      )}

      {/* Lista de arreglos paginados (5 por página) */}
      <div className="lista">
        {lista.map((arr) => {
          const enPruebas = arr.estadoMaquina === "en_pruebas";
          return (
            <article key={arr.id} className={`card ${enPruebas ? "borde-warn" : "borde-ok"}`}>
              <div className="fila" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>Reparación #{arr.id}</strong>
                  <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                    Ref: #INC-{arr.incidenciaId}
                  </span>
                </div>
                <span
                  className={`chip ${enPruebas ? "chip-warn" : "chip-ok"}`}
                  style={{ textTransform: "capitalize" }}
                >
                  {enPruebas ? "En pruebas / Cuarentena" : arr.estadoMaquina ?? "operativa"}
                </span>
              </div>

              {arr.accionCorrectiva && (
                <p style={{ margin: "0.5rem 0", fontSize: "0.9rem" }}>
                  <strong>Acción:</strong> {arr.accionCorrectiva.replace("_", " ")}
                  {arr.notas && <span className="muted"> — {arr.notas}</span>}
                </p>
              )}

              <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>Repuestos utilizados:</strong>
                {!arr.lineasUso || arr.lineasUso.length === 0 ? (
                  <span className="muted">Sin uso de repuestos.</span>
                ) : (
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.2rem" }}>
                    {arr.lineasUso.map((l) => (
                      <li key={l.id}>
                        {l.repuestoCodigo} ({l.cantidad} u.)
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {arr.cerradaEn && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px solid var(--superficie-alta)",
                    fontSize: "0.75rem",
                    color: "var(--texto-suave)",
                  }}
                >
                  Cerrada {haceCuanto(arr.cerradaEn)} · {arr.minutosIntervencion ?? 30} min intervención
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Controles de paginación (5 por página) */}
      {cerradasOrdenadas.length > TAMANO_PAGINA && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.25rem",
            padding: "0.75rem",
            background: "var(--superficie)",
            borderRadius: "var(--radio)",
            boxShadow: "var(--sombra)",
          }}
        >
          <button
            type="button"
            className="btn"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          >
            ← Anterior
          </button>

          <span style={{ fontSize: "0.85rem", fontWeight: 700 }} className="muted">
            Página {paginaActual} de {totalPaginas}
          </span>

          <button
            type="button"
            className="btn"
            disabled={paginaActual >= totalPaginas}
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </Layout>
  );
}
