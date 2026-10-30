import { Link } from "react-router-dom";
import Layout from "../../components/Layout";

export default function PanelOperario() {
  return (
    <Layout titulo="Planta · Operario" subtitulo="Inicio panel">
      <div className="centro">
        <Link to="/incidencias/nueva" className="hero-incidencia">
          <span className="hero-icono">!</span>
          <strong>Reportar Incidencia</strong>
          <span>Avería, parada de máquina o emergencia</span>
        </Link>
        <p className="muted center">
          Tocá el botón para notificar cualquier parada o anomalía de forma inmediata al equipo técnico.
        </p>
      </div>
    </Layout>
  );
}
