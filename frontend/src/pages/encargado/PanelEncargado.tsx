import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type { ItemListaCompras, Maquina, Reserva } from "../../api/tipos";

export default function PanelEncargado() {
  const reservas = useApi<Reserva[]>("/reservas?estado=activa");
  const compras = useApi<ItemListaCompras[]>("/lista-compras");
  const maquinas = useApi<Maquina[]>("/maquinas");

  return (
    <Layout>
      <h1 className="h2">Gestión principal</h1>
      <p className="muted">Seleccioná una acción operativa para continuar</p>
      <div className="lista">
        <Link to="/encargado/maquinas" className="card card-link">
          <div>
            <strong>Gestión de Maquinaria</strong>
            <small className="muted">Parque de equipos, repuestos críticos y estados (RN-07)</small>
            <span className="chip chip-ok">{maquinas.data?.length ?? "–"} máquinas</span>
          </div>
          <span>→</span>
        </Link>
        <Link to="/reservas" className="card card-link">
          <div>
            <strong>Autorización de Reservas</strong>
            <small className="muted">Liberación y aprobación de material reservado</small>
            <span className="chip chip-error">{reservas.data?.length ?? "–"} pendientes</span>
          </div>
          <span>→</span>
        </Link>
        <Link to="/compras" className="card card-link">
          <div>
            <strong>Lista de Compras & Reposición</strong>
            <small className="muted">Material bajo umbral de seguridad</small>
            <span className="chip">{compras.data?.length ?? "–"} referencias</span>
          </div>
          <span>→</span>
        </Link>
      </div>
    </Layout>
  );
}
