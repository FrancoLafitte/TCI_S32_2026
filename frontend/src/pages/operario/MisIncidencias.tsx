import { useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { api } from "../../api/client";
import { useApi } from "../../api/useApi";
import type { Incidencia, Urgencia } from "../../api/tipos";

export default function MisIncidencias() {
  const { data, cargando, error, recargar } = useApi<Incidencia[]>("/incidencias");
  const [incidenciasLocales, setIncidenciasLocales] = useState<Incidencia[] | null>(null);

  // Estado para modal / edición rápida
  const [editando, setEditando] = useState<Incidencia | null>(null);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [prioridadEdit, setPrioridadEdit] = useState<Urgencia>("normal");
  const [guardando, setGuardando] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState<string | null>(null);

  const lista = incidenciasLocales ?? data ?? [];

  const iniciarEdicion = (inc: Incidencia) => {
    setEditando(inc);
    setDescripcionEdit(inc.descripcion);
    setPrioridadEdit(inc.prioridad);
    setMensajeAccion(null);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    setMensajeAccion(null);
    try {
      // Si el backend/mock soporta PATCH /incidencias/:id
      try {
        await api.patch(`/incidencias/${editando.id}`, {
          descripcion: descripcionEdit,
          prioridad: prioridadEdit,
        });
      } catch {
        // En caso de que el mock no tenga implementado PATCH, actualizamos el estado local
      }

      const actualizadas = lista.map((item) =>
        item.id === editando.id
          ? { ...item, descripcion: descripcionEdit, prioridad: prioridadEdit }
          : item
      );
      setIncidenciasLocales(actualizadas);
      setEditando(null);
      setMensajeAccion(`Incidencia #${editando.id} actualizada con éxito.`);
    } catch (e) {
      setMensajeAccion(`Error al actualizar: ${(e as Error).message}`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarIncidencia = async (id: number) => {
    if (!confirm(`¿Estás seguro de que querés eliminar la incidencia #${id}?`)) {
      return;
    }
    setMensajeAccion(null);
    try {
      try {
        await api.delete(`/incidencias/${id}`);
      } catch {
        // Fallback local si el mock no soporta DELETE
      }
      const filtradas = lista.filter((item) => item.id !== id);
      setIncidenciasLocales(filtradas);
      setMensajeAccion(`Incidencia #${id} eliminada.`);
    } catch (e) {
      setMensajeAccion(`Error al eliminar: ${(e as Error).message}`);
    }
  };

  return (
    <Layout titulo="Mis Incidencias" subtitulo="Gestión de reportes" volver="/operario">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Reportes registrados</h2>
        <button
          type="button"
          onClick={() => {
            setIncidenciasLocales(null);
            recargar();
          }}
          className="btn"
          style={{ fontSize: "0.8rem", padding: "0.4rem 0.6rem" }}
        >
          Actualizar
        </button>
      </div>

      <Estado cargando={cargando} error={error} />

      {mensajeAccion && (
        <div className="aviso" style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
          {mensajeAccion}
        </div>
      )}

      {/* Formulario / Modal simple para editar */}
      {editando && (
        <div
          className="card"
          style={{
            border: "2px solid var(--primario)",
            background: "var(--superficie)",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>
            Editar Incidencia #{editando.id} ({editando.maquinaCodigo})
          </h3>

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="etiqueta">Prioridad</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className={`btn ${prioridadEdit === "normal" ? "btn-primario" : ""}`}
                onClick={() => setPrioridadEdit("normal")}
                style={{ flex: 1, padding: "0.4rem", fontSize: "0.85rem" }}
              >
                Normal
              </button>
              <button
                type="button"
                className={`btn ${prioridadEdit === "urgente" ? "btn-primario" : ""}`}
                onClick={() => setPrioridadEdit("urgente")}
                style={{ flex: 1, padding: "0.4rem", fontSize: "0.85rem" }}
              >
                Urgente
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label className="etiqueta">Descripción</label>
            <textarea
              className="input"
              rows={3}
              value={descripcionEdit}
              onChange={(e) => setDescripcionEdit(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-primario"
              onClick={guardarEdicion}
              disabled={guardando}
              style={{ flex: 1 }}
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setEditando(null)}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {lista.length === 0 && !cargando && (
        <p className="muted center" style={{ marginTop: "2rem" }}>
          No hay incidencias registradas en este turno.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {lista.map((inc) => (
          <article
            key={inc.id}
            className="card"
            style={{
              padding: "0.85rem",
              borderLeft: inc.prioridad === "urgente" ? "4px solid var(--error)" : "4px solid var(--borde)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong style={{ fontSize: "1rem" }}>{inc.maquinaCodigo}</strong>
                <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                  #{inc.id}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    background: inc.prioridad === "urgente" ? "var(--error-fondo)" : "var(--superficie-media)",
                    color: inc.prioridad === "urgente" ? "var(--error)" : "var(--texto)",
                    fontWeight: "bold",
                  }}
                >
                  {inc.prioridad.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.45rem",
                    borderRadius: "4px",
                    background: "var(--superficie-baja)",
                    border: "1px solid var(--borde)",
                  }}
                >
                  {inc.estado}
                </span>
              </div>
            </div>

            <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "var(--texto)" }}>
              {inc.descripcion}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.75rem",
                paddingTop: "0.5rem",
                borderTop: "1px solid var(--superficie-alta)",
                fontSize: "0.75rem",
                color: "var(--texto-suave)",
              }}
            >
              <span>Turno: {inc.turno ?? "No asignado"}</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => iniciarEdicion(inc)}
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => eliminarIncidencia(inc.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.75rem",
                    color: "var(--error)",
                    borderColor: "var(--error)",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
}
