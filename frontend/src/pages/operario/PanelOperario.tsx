import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { useRol } from "../../rol";
import { obtenerTurnoActual } from "../../utils/turno";

export default function PanelOperario() {
  const { usuario } = useRol();
  const turno = obtenerTurnoActual();

  const fechaFormateada = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Layout titulo="Planta · Operario" subtitulo={turno.etiqueta}>
      {/* Banner de información de Operario y Turno Asignado */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--texto-suave)", textTransform: "capitalize" }}>
              {fechaFormateada}
            </span>
            <h2 style={{ margin: "0.25rem 0", fontSize: "1.15rem", color: "var(--texto)" }}>
              {usuario?.nombre ?? "Operario de Planta"}
            </h2>
            <small className="muted">{usuario?.email ?? "operario@planta.com"}</small>
          </div>

          <div
            style={{
              background: "var(--superficie-baja)",
              border: "1px solid var(--borde)",
              padding: "0.4rem 0.6rem",
              borderRadius: "6px",
              textAlign: "right",
            }}
          >
            <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--texto)" }}>
              {turno.etiqueta}
            </strong>
            <small style={{ color: "var(--texto-suave)", fontSize: "0.75rem" }}>
              {turno.horario}
            </small>
          </div>
        </div>
      </div>

      {/* Botón principal de acción rápida */}
      <div className="centro" style={{ marginTop: "1rem" }}>
        <Link to="/incidencias/nueva" className="hero-incidencia">
          <span className="hero-icono">!</span>
          <strong>Reportar Incidencia</strong>
          <span>Avería, parada de máquina o emergencia</span>
        </Link>
        <p className="muted center" style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
          Notificá paradas o anomalías al equipo técnico adjuntando fotos y código de máquina.
        </p>
      </div>
    </Layout>
  );
}
