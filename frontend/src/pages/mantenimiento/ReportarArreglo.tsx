import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { api, ApiError } from "../../api/client";
import { useApi } from "../../api/useApi";
import type { AccionCorrectiva, EstadoMaquina, Incidencia, Reparacion, Repuesto, ResultadoLineaUso } from "../../api/tipos";

const TIEMPOS = [15, 30, 45, 60];
const ACCIONES: { valor: AccionCorrectiva; texto: string }[] = [
  { valor: "reemplazo_pieza", texto: "Reemplazo de sello / junta" },
  { valor: "calibracion", texto: "Calibración" },
  { valor: "ajuste_mecanico", texto: "Ajuste mecánico" },
  { valor: "limpieza", texto: "Limpieza / Purga CIP" },
];
const ESTADOS: { valor: EstadoMaquina; texto: string; detalle: string }[] = [
  { valor: "operativa", texto: "Operativa / En marcha", detalle: "Habilitada para reinicio de lote" },
  { valor: "en_pruebas", texto: "En pruebas / Cuarentena", detalle: "Requiere validación de Calidad" },
  { valor: "fuera_de_servicio", texto: "Requiere parada / Mantenimiento mayor", detalle: "Equipo bloqueado" },
];

type Linea = { repuesto: Repuesto; cantidad: number };

export default function ReportarArreglo() {
  const { id } = useParams();
  const nav = useNavigate();
  const inc = useApi<Incidencia>(`/incidencias/${id}`);
  const catalogo = useApi<Repuesto[]>("/repuestos");

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [codigoAgregar, setCodigoAgregar] = useState("");
  const [minutos, setMinutos] = useState(45);
  const [accion, setAccion] = useState<AccionCorrectiva>("reemplazo_pieza");
  const [notas, setNotas] = useState("");
  const [estadoMaquina, setEstadoMaquina] = useState<EstadoMaquina>("operativa");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ rep: Reparacion; alertas: number } | null>(null);

  function agregar() {
    const r = catalogo.data?.find((x) => x.codigo === codigoAgregar);
    if (!r || lineas.some((l) => l.repuesto.codigo === r.codigo)) return;
    setLineas([...lineas, { repuesto: r, cantidad: 1 }]);
    setCodigoAgregar("");
  }

  function cambiarCantidad(codigo: string, delta: number) {
    setLineas(lineas.map((l) => (l.repuesto.codigo === codigo ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l)));
  }

  /** Flujo del contrato: 1) POST /reparaciones  2) POST lineas-uso por cada repuesto  3) POST cierre */
  async function registrar() {
    setEnviando(true);
    setError(null);
    try {
      const rep = await api.post<Reparacion>("/reparaciones", { incidenciaId: Number(id) });
      let alertas = 0;
      for (const l of lineas) {
        const r = await api.post<ResultadoLineaUso>(`/reparaciones/${rep.id}/lineas-uso`, {
          repuestoCodigo: l.repuesto.codigo,
          cantidad: l.cantidad,
        });
        if (r.alertaGenerada) alertas++;
      }
      const cerrada = await api.post<Reparacion>(`/reparaciones/${rep.id}/cierre`, {
        minutosIntervencion: minutos,
        accionCorrectiva: accion,
        notas,
        estadoMaquina,
      });
      setResultado({ rep: cerrada, alertas });
    } catch (e) {
      // 409 STOCK_INSUFICIENTE (RN-01) o REPUESTO_RESERVADO (RN-05)
      setError(e instanceof ApiError ? `${e.codigo}: ${e.message}` : (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <Layout titulo="Arreglo registrado" volver="/mantenimiento">
        <div className="aviso aviso-ok">
          Reparación #{resultado.rep.id} cerrada. Se descontó el stock de {lineas.length} repuesto(s) (RN-01).
        </div>
        {resultado.alertas > 0 && (
          <div className="aviso aviso-error">⚠ {resultado.alertas} repuesto(s) quedaron bajo el umbral mínimo: se generó alerta (RN-02).</div>
        )}
        <button className="btn btn-primario" onClick={() => nav("/mantenimiento")}>Volver al inicio</button>
      </Layout>
    );
  }

  return (
    <Layout
      titulo="Reportar Arreglo"
      subtitulo="Paso 2 de 2 · Resolución técnica"
      volver="/reparar"
      pie={
        <button className="btn btn-primario btn-grande" disabled={enviando || !inc.data} onClick={registrar}>
          {enviando ? "Registrando…" : "⊘ Registrar arreglo y descontar stock"}
        </button>
      }
    >
      <Estado cargando={inc.cargando} error={inc.error} />
      {inc.data && (
        <section className={`card borde-${inc.data.prioridad === "urgente" ? "error" : "neutro"}`}>
          <span className="chip chip-error">#INC-{inc.data.id} · {inc.data.prioridad}</span>
          <strong className="h3">{inc.data.maquina?.nombre ?? inc.data.maquinaCodigo}</strong>
          <small className="muted">{inc.data.maquina?.linea}</small>
          <p className="aviso aviso-error">⚠ {inc.data.descripcion}</p>
        </section>
      )}

      <section className="card">
        <h3 className="h3"><span className="num">1</span> Repuestos utilizados</h3>
        {lineas.map((l) => (
          <div key={l.repuesto.codigo} className="card card-interna">
            <div className="fila">
              <span className="chip chip-codigo">{l.repuesto.codigo}</span>
              <small className="muted">Disponible {l.repuesto.stockDisponible} uds</small>
            </div>
            <strong>{l.repuesto.nombre}</strong>
            <small className="muted">📦 {l.repuesto.ubicacion.descripcion ?? l.repuesto.ubicacion.codigo}</small>
            <div className="stepper">
              <button className="btn" onClick={() => cambiarCantidad(l.repuesto.codigo, -1)}>−</button>
              <span>{l.cantidad}</span>
              <button className="btn btn-primario" onClick={() => cambiarCantidad(l.repuesto.codigo, 1)}>+</button>
            </div>
            <p className="aviso aviso-ok">Se descontará {l.cantidad} unidad(es) de {l.repuesto.ubicacion.codigo} (RN-01).</p>
          </div>
        ))}
        <div className="fila">
          <select className="input" value={codigoAgregar} onChange={(e) => setCodigoAgregar(e.target.value)}>
            <option value="">Escanear / elegir repuesto…</option>
            {catalogo.data?.map((r) => (
              <option key={r.codigo} value={r.codigo}>{r.codigo} · {r.nombre}</option>
            ))}
          </select>
          <button className="btn" onClick={agregar}>+ Agregar</button>
        </div>
      </section>

      <section className="card">
        <h3 className="h3"><span className="num">2</span> Trabajo realizado</h3>
        <label className="etiqueta">Tiempo de intervención</label>
        <div className="chips">
          {TIEMPOS.map((t) => (
            <button key={t} className={`chip-btn ${minutos === t ? "activa" : ""}`} onClick={() => setMinutos(t)}>
              {t < 60 ? `${t}m` : "1 h"}
            </button>
          ))}
        </div>
        <label className="etiqueta">Acción correctiva principal</label>
        <div className="chips">
          {ACCIONES.map((a) => (
            <button key={a.valor} className={`chip-btn ${accion === a.valor ? "activa" : ""}`} onClick={() => setAccion(a.valor)}>{a.texto}</button>
          ))}
        </div>
        <label className="etiqueta">Notas técnicas</label>
        <textarea className="input" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </section>

      <section className="card">
        <h3 className="h3"><span className="num">3</span> Estado resultante del equipo</h3>
        {ESTADOS.map((e) => (
          <label key={e.valor} className={`radio ${estadoMaquina === e.valor ? "activa" : ""}`}>
            <input type="radio" checked={estadoMaquina === e.valor} onChange={() => setEstadoMaquina(e.valor)} />
            <span><strong>{e.texto}</strong><small className="muted">{e.detalle}</small></span>
          </label>
        ))}
      </section>

      {error && <p className="aviso aviso-error">{error}</p>}
    </Layout>
  );
}
