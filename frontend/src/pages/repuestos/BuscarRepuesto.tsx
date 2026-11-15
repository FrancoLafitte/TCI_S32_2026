import { useState } from "react";
import { Link } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type { Repuesto } from "../../api/tipos";

export default function BuscarRepuesto() {
  const { data, cargando, error } = useApi<Repuesto[]>("/repuestos");
  const [texto, setTexto] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const TAMANO_PAGINA = 5;

  const bajo = (r: Repuesto) => r.stockDisponible <= r.umbralMinimo; // RN-02
  const visibles = (data ?? [])
    .filter((r) => !soloBajo || bajo(r))
    .filter((r) => `${r.codigo} ${r.nombre} ${r.maquinasCompatibles?.join(" ")}`.toLowerCase().includes(texto.toLowerCase()));

  const totalPaginas = Math.ceil(visibles.length / TAMANO_PAGINA) || 1;
  const inicio = (paginaActual - 1) * TAMANO_PAGINA;
  const lista = visibles.slice(inicio, inicio + TAMANO_PAGINA);

  function cambiarTexto(nuevoTexto: string) {
    setTexto(nuevoTexto);
    setPaginaActual(1);
  }

  function cambiarFiltroBajo(valor: boolean) {
    setSoloBajo(valor);
    setPaginaActual(1);
  }

  return (
    <Layout titulo="Buscar Repuesto" subtitulo="Mantenimiento GMP" volver="/repuestos">
      <input className="input" placeholder="⌕ Código, nombre o máquina…" value={texto} onChange={(e) => cambiarTexto(e.target.value)} />
      <div className="chips">
        <button className={`chip-btn ${!soloBajo ? "activa" : ""}`} onClick={() => cambiarFiltroBajo(false)}>Todos</button>
        <button className={`chip-btn ${soloBajo ? "activa" : ""}`} onClick={() => cambiarFiltroBajo(true)}>▲ Stock bajo / Alerta</button>
      </div>
      <Estado cargando={cargando} error={error} />
      <div className="lista">
        {lista.map((r) => (
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

            <Link
              to={`/repuestos/${encodeURIComponent(r.codigo)}/trazabilidad`}
              className="btn"
              style={{
                marginTop: "0.5rem",
                textAlign: "center",
                fontSize: "0.85rem",
                padding: "0.5rem",
                background: "var(--superficie-baja)",
                border: "1px solid var(--borde)",
                display: "block",
              }}
            >
              Ver trazabilidad / movimientos (RN-06) →
            </Link>
          </div>
        ))}
      </div>

      {/* Controles de paginación (5 repuestos por página) */}
      {visibles.length > TAMANO_PAGINA && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1.25rem",
            padding: "0.75rem",
            background: "var(--superficie)",
            borderRadius: "var(--radio)",
            boxShadow: "var(--sombra)",
          }}
        >
          <button
            type="button"
            className="btn"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          >
            ← Anterior
          </button>

          <span style={{ fontSize: "0.85rem", fontWeight: 700 }} className="muted">
            Página {paginaActual} de {totalPaginas} ({visibles.length} repuestos)
          </span>

          <button
            type="button"
            className="btn"
            disabled={paginaActual >= totalPaginas}
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </Layout>
  );
}
