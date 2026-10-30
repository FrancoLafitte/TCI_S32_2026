import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { haceCuanto, useApi } from "../../api/useApi";
import type { ResumenTablero } from "../../api/tipos";

export default function RepuestosHome() {
  const { data } = useApi<ResumenTablero>("/tablero/resumen");

  return (
    <Layout subtitulo="Repuestos & Almacén">
      <span className="chip">Módulo almacén</span>
      <h1 className="h1">Repuestos & Stock</h1>
      <p className="muted">Consulta de existencias y recepción de material en almacén</p>

      <Link to="/repuestos/buscar" className="banner-negro">
        <div><strong>Buscar repuesto</strong><small>Consultar stock, ubicación y compatibilidad</small></div>
        <span>→</span>
      </Link>
      <Link to="/repuestos/ingresar" className="banner-verde">
        <div><strong>Ingresar repuesto <span className="chip chip-ok">ENTRADA</span></strong><small>Registrar recepción, lote, cantidad y ubicación</small></div>
        <span>→</span>
      </Link>

      <h2 className="h2">Resumen rápido de almacén</h2>
      <div className="grid-2">
        <div className="card"><small className="etiqueta">Total referencias</small><span className="kpi">{data?.totalRepuestos.toLocaleString("es-AR") ?? "–"}</span></div>
        <div className="card card-error"><small className="etiqueta">Stock bajo</small><span className="kpi">{data?.repuestosBajoUmbral ?? "–"}</span><small>alertas</small></div>
      </div>
      {data?.ultimoIngreso && (
        <div className="card fila">
          <span><small className="etiqueta">Último ingreso registrado</small><strong>{data.ultimoIngreso.nombre} (x{data.ultimoIngreso.cantidad})</strong></span>
          <small className="muted">{haceCuanto(data.ultimoIngreso.fecha)}</small>
        </div>
      )}
    </Layout>
  );
}
