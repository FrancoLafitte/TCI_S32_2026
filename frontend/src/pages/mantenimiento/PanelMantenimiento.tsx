import { Link } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type { Incidencia } from "../../api/tipos";
import { TarjetaIncidenciaCorta } from "./componentes";

export default function PanelMantenimiento() {
  const { data, cargando, error } = useApi<Incidencia[]>("/incidencias");
  const activas = (data ?? []).filter((i) => i.estado !== "resuelta");

  return (
    <Layout>
      <Link to="/reparar" className="banner-negro">
        <div>
          <strong>Reportar Arreglo ⚡</strong>
          <small>Seleccionar incidencia y escanear repuestos</small>
        </div>
        <span>→</span>
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
