import { useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type { Repuesto } from "../../api/tipos";

export default function BuscarRepuesto() {
  const { data, cargando, error } = useApi<Repuesto[]>("/repuestos");
  const [texto, setTexto] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);

  const bajo = (r: Repuesto) => r.stockDisponible <= r.umbralMinimo; // RN-02
  const visibles = (data ?? [])
    .filter((r) => !soloBajo || bajo(r))
    .filter((r) => `${r.codigo} ${r.nombre} ${r.maquinasCompatibles?.join(" ")}`.toLowerCase().includes(texto.toLowerCase()));

  return (
    <Layout titulo="Buscar Repuesto" subtitulo="Mantenimiento GMP" volver="/repuestos">
      <input className="input" placeholder="🔍 Código, nombre o máquina…" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="chips">
        <button className={`chip-btn ${!soloBajo ? "activa" : ""}`} onClick={() => setSoloBajo(false)}>Todos</button>
        <button className={`chip-btn ${soloBajo ? "activa" : ""}`} onClick={() => setSoloBajo(true)}>⚠ Stock bajo / Alerta</button>
      </div>
      <Estado cargando={cargando} error={error} />
      <div className="lista">
        {visibles.map((r) => (
          <div key={r.codigo} className={`card borde-top-${bajo(r) ? "error" : "ok"}`}>
            <div className="fila">
              <span>
                <span className="chip chip-codigo">{r.codigo}</span>{" "}
                {bajo(r) ? <span className="chip chip-error">Alerta mínimo</span> : <span className="chip chip-ok">Stock OK</span>}
              </span>
              <span className={`kpi ${bajo(r) ? "texto-error" : ""}`}>{r.stockDisponible}</span>
            </div>
            <strong className="h3">{r.nombre}</strong>
            {bajo(r) && <small className="texto-error">Mín. {r.umbralMinimo} unid.</small>}
            <div className="card card-interna">
              <small className="etiqueta">Ubicación física</small>
              <strong>{r.ubicacion.descripcion ?? r.ubicacion.codigo}</strong>
            </div>
            {r.maquinasCompatibles?.length ? (
              <div className="chips"><small className="muted">Compatible:</small>{r.maquinasCompatibles.map((m) => <span key={m} className="chip">{m}</span>)}</div>
            ) : null}
            {bajo(r) && <p className="aviso aviso-error">Bajo stock crítico. Reposición sugerida a Compras.</p>}
          </div>
        ))}
      </div>
    </Layout>
  );
}
