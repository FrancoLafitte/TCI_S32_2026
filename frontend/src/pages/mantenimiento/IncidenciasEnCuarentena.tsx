import Layout from "../../components/Layout";
import { api } from "../../api/client";
import { useIncidencias } from "../../api/useIncidencias";

export default function IncidenciasEnCuarentena() {
  const { incidencias, cargando, recargar } = useIncidencias();

  // Incidencias en cuarentena directamente del backend
  const enCuarentena = incidencias.filter((inc) => inc.estado === "en_cuarentena");

  async function aprobar(incId: number) {
    try {
      await api.patch(`/incidencias/${incId}`, { estado: "resuelta" });
      recargar();
    } catch (e) {
      alert(`Error al actualizar estado: ${(e as Error).message}`);
    }
  }

  return (
    <Layout titulo="Incidencias en cuarentena" subtitulo="Esperando aprobacion de Calidad" volver="/mantenimiento">
      {cargando && <p className="muted">Cargando…</p>}

      {!cargando && enCuarentena.length === 0 && (
        <div className="aviso aviso-ok">No hay incidencias en cuarentena en este momento.</div>
      )}

      <div className="lista">
        {enCuarentena.map((inc) => (
          <div key={inc.id} className={`card borde-${inc.prioridad === "urgente" ? "error" : "warn"}`}>
            <div className="fila" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="chip chip-codigo">#INC-{inc.id}</span>
                <span className="chip" style={{ marginLeft: "0.4rem", background: "var(--advertencia, #f59e0b)", color: "#000" }}>
                  En cuarentena
                </span>
              </div>
              <span className={`chip ${inc.prioridad === "urgente" ? "chip-error" : "chip-warn"}`}>
                {inc.prioridad}
              </span>
            </div>

            <strong className="h3" style={{ marginTop: "0.5rem" }}>
              {inc.maquina?.nombre ?? inc.maquinaCodigo}
            </strong>
            {inc.maquina?.linea && <small className="muted">{inc.maquina.linea}</small>}
            <p style={{ marginTop: "0.4rem", fontSize: "0.9rem" }}>{inc.descripcion}</p>
            <small className="muted">
              Reportada: {new Date(inc.creadaEn).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </small>

            <button
              className="btn btn-primario"
              style={{ marginTop: "0.75rem", width: "100%" }}
              onClick={() => aprobar(inc.id)}
            >
              Marcar como operativa
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
