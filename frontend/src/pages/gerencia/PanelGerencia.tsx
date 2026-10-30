import Layout, { Estado } from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type { Incidencia, PedidoCompra, Repuesto, ResumenTablero } from "../../api/tipos";

const TURNO = { manana: "Mañana", tarde: "Tarde", noche: "Noche" } as const;

export default function PanelGerencia() {
  const resumen = useApi<ResumenTablero>("/tablero/resumen");
  const incidencias = useApi<Incidencia[]>("/incidencias");
  const pedidos = useApi<PedidoCompra[]>("/pedidos-compra");
  const repuestos = useApi<Repuesto[]>("/repuestos?bajoUmbral=true");
  const r = resumen.data;
  // Prism no filtra: igual filtramos en el navegador por RN-02.
  const criticos = (repuestos.data ?? []).filter((x) => x.stockDisponible <= x.umbralMinimo);

  return (
    <Layout titulo="Panel Gerencia y Administración" subtitulo="Supervisión operativa · solo lectura" ancho>
      <Estado cargando={resumen.cargando} error={resumen.error} />
      <div className="grid-kpi">
        <div className="card borde-error"><small className="etiqueta">Incidencias activas</small><span className="kpi">{r?.incidenciasActivas ?? "–"}</span><small className="texto-error">{r?.incidenciasUrgentes} urgentes</small></div>
        <div className="card borde-warn"><small className="etiqueta">Repuestos bajo umbral</small><span className="kpi">{r?.repuestosBajoUmbral ?? "–"}</span></div>
        <div className="card borde-error"><small className="etiqueta">Pedidos urgentes</small><span className="kpi">{r?.pedidosUrgentes ?? "–"}</span><small>{r?.pedidosPendientes} pendientes</small></div>
        <div className="card borde-ok"><small className="etiqueta">Reservas activas</small><span className="kpi">{r?.reservasActivas ?? "–"}</span></div>
      </div>

      <div className="grid-gerencia">
        <section className="card">
          <h2 className="h3">Triage de incidencias activas</h2>
          <table className="tabla">
            <thead><tr><th>Máquina</th><th>Línea</th><th>Turno</th><th>Estado</th></tr></thead>
            <tbody>
              {incidencias.data?.map((i) => (
                <tr key={i.id}>
                  <td><strong>{i.maquina?.nombre}</strong><br /><small className="muted">#INC-{i.id}</small></td>
                  <td>{i.maquina?.linea}</td>
                  <td><span className="chip">{TURNO[i.turno]}</span></td>
                  <td><span className={`chip ${i.prioridad === "urgente" ? "chip-error" : "chip-warn"}`}>{i.estado.replace("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="lista">
          <section className="card">
            <h2 className="h3">Pedidos de compra</h2>
            <table className="tabla">
              <thead><tr><th>ID</th><th>Urgencia</th><th>Monto</th><th>Estado</th></tr></thead>
              <tbody>
                {pedidos.data?.map((p) => (
                  <tr key={p.id}>
                    <td>#OC-{p.id}</td>
                    <td><span className={`chip ${p.urgencia === "urgente" ? "chip-error" : ""}`}>{p.urgencia}</span></td>
                    <td>${p.montoEstimado?.toLocaleString("es-AR") ?? "–"}</td>
                    <td>{p.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="card">
            <h2 className="h3">Stock crítico & reorden</h2>
            {criticos.map((x) => (
              <div key={x.codigo} className="card card-interna">
                <strong>{x.nombre}</strong>
                <small className="muted">Cód: {x.codigo} · Stock {x.stockDisponible} · Mín {x.umbralMinimo}</small>
                <div className="barra"><span style={{ width: `${Math.min(100, (x.stockDisponible / Math.max(1, x.umbralMinimo)) * 100)}%` }} /></div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </Layout>
  );
}
