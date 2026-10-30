import { useState } from "react";
import Layout from "../../components/Layout";
import { api, ApiError } from "../../api/client";
import type { Repuesto } from "../../api/tipos";

export default function IngresarRepuesto() {
  const [codigo, setCodigo] = useState("REP-7742");
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [lote, setLote] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [ubicacion, setUbicacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<Repuesto | null>(null);

  async function buscar() {
    setError(null);
    try {
      const r = await api.get<Repuesto>(`/repuestos/${encodeURIComponent(codigo)}`);
      setRepuesto(r);
      setUbicacion(r.ubicacion.codigo); // ubicación habitual sugerida
    } catch (e) {
      setRepuesto(null);
      setError(e instanceof ApiError && e.status === 404 ? "No existe un repuesto con ese código." : (e as Error).message);
    }
  }

  async function confirmar() {
    if (!repuesto) return;
    setError(null);
    try {
      const r = await api.post<Repuesto>(`/repuestos/${repuesto.codigo}/ingresos`, {
        cantidad,
        lote: lote || undefined,
        ubicacion: { codigo: ubicacion },
      });
      setOk(r);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Layout
      titulo="Ingresar Repuesto"
      subtitulo="Mantenimiento GMP"
      volver="/repuestos"
      pie={<button className="btn btn-primario btn-grande" disabled={!repuesto || !ubicacion} onClick={confirmar}>▣ Confirmar ingreso al stock</button>}
    >
      {ok && <div className="aviso aviso-ok">Ingreso registrado. Stock físico de {ok.codigo}: {ok.stockFisico} uds (RN-08).</div>}

      <section className="card">
        <h3 className="h3"><span className="num">1</span> Identificación del repuesto</h3>
        <div className="fila">
          <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código o escaneo" />
          <button className="btn" onClick={buscar}>Buscar</button>
        </div>
        {repuesto && (
          <div className="card card-interna borde-ok">
            <span className="chip chip-codigo">{repuesto.codigo}</span>
            <strong>{repuesto.nombre}</strong>
            <small className="muted">Stock actual: {repuesto.stockDisponible} uds (alerta mínima: {repuesto.umbralMinimo})</small>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="h3"><span className="num">2</span> Datos de lote y cantidad</h3>
        <label className="etiqueta">Número de lote</label>
        <input className="input" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="L-2024-V98" />
        <label className="etiqueta">Cantidad física recibida</label>
        <div className="stepper">
          <button className="btn" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
          <span className="kpi">{cantidad}<small> uds</small></span>
          <button className="btn btn-primario" onClick={() => setCantidad(cantidad + 1)}>+</button>
        </div>
      </section>

      <section className="card">
        <h3 className="h3"><span className="num">3</span> Asignación de ubicación</h3>
        {repuesto && <span className="chip chip-ok">Ubicación habitual sugerida</span>}
        <input className="input" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="A-03-12" />
      </section>

      {error && <p className="aviso aviso-error">{error}</p>}
    </Layout>
  );
}
