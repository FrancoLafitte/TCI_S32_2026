import { Link } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { useIncidencias } from "../../api/useIncidencias";
import { TarjetaIncidenciaCorta } from "./componentes";

export default function PanelMantenimiento() {
  const { incidencias, cargando, error } = useIncidencias();

  // Excluir resueltas y en cuarentena de la lista de trabajo activo
  const activas = incidencias.filter(
    (i) => i.estado !== "resuelta" && i.estado !== "en_cuarentena"
  );
  const cantCuarentena = incidencias.filter((i) => i.estado === "en_cuarentena").length;

  return (
    <Layout>
      <Link to="/reparar" className="banner-negro">
        <div>
          <strong>Reportar Arreglo ⚡</strong>
          <small>Seleccionar incidencia y escanear repuestos</small>
        </div>
        <span>→</span>
      </Link>

      <Link
        to="/mantenimiento/arreglos"
        className="btn"
        style={{
          width: "100%",
          padding: "0.75rem",
          textAlign: "center",
          background: "var(--superficie)",
          border: "1px solid var(--borde)",
          display: "block",
          fontSize: "0.9rem",
          margin: "0.5rem 0",
        }}
      >
        Ver arreglos realizados
      </Link>

      <Link
        to="/mantenimiento/cuarentena"
        className="btn"
        style={{
          width: "100%",
          padding: "0.75rem",
          textAlign: "center",
          background: "var(--superficie)",
          border: "1px solid var(--advertencia, #f59e0b)",
          display: "block",
          fontSize: "0.9rem",
          margin: "0.5rem 0",
        }}
      >
        Cuarentena / Esperando aprobacion{cantCuarentena > 0 ? ` (${cantCuarentena})` : ""}
      </Link>

      <div className="fila-titulo">
        <h2 className="h2">⚠ Incidencias recientes</h2>
        <span className="muted">{activas.length} activas</span>
      </div>
      <Estado cargando={cargando} error={error} />
      <div className="lista">
        {activas.map((i) => (
          <Link key={i.id} to={`/reparar/${i.id}`}>
            <TarjetaIncidenciaCorta inc={i} />
          </Link>
        ))}
      </div>
    </Layout>
  );
}
