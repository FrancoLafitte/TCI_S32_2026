import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import SelectorFotos from "../../components/SelectorFotos";
import ModalEscanerMaquina from "../../components/ModalEscanerMaquina";
import { api } from "../../api/client";
import { useApi } from "../../api/useApi";
import type { Incidencia, Maquina, TipoFalla, Urgencia } from "../../api/tipos";

const FALLAS: { valor: TipoFalla; texto: string }[] = [
  { valor: "perdida_presion", texto: "Pérdida de presión" },
  { valor: "ruido_anomalo", texto: "Ruido anómalo" },
  { valor: "fuga_fluido", texto: "Fuga de fluido" },
  { valor: "otro", texto: "Otro" },
];

export default function ReportarIncidencia() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const maquinas = useApi<Maquina[]>("/maquinas");

  const [maquinaCodigo, setMaquinaCodigo] = useState("");
  const [escanerAbierto, setEscanerAbierto] = useState(
    searchParams.get("scan") === "1" || searchParams.get("scan") === "true"
  );
  const [escaneadaExito, setEscaneadaExito] = useState(false);
  const [prioridad, setPrioridad] = useState<Urgencia>("normal");
  const [tipoFalla, setTipoFalla] = useState<TipoFalla | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<Incidencia | null>(null);

  // Auto-seleccionar si se recibió ?maquina=CODIGO
  useEffect(() => {
    const param = searchParams.get("maquina");
    if (param) {
      setMaquinaCodigo(param);
      setEscaneadaExito(true);
    }
  }, [searchParams]);

  const maquina = maquinas.data?.find((m) => m.codigo === maquinaCodigo);

  async function enviar() {
    if (!maquinaCodigo || !descripcion.trim()) {
      setError("Elegí el equipo y describí la falla.");
      return;
    }
    setEnviando(true);
    setError(null);
    // El contrato pide multipart/form-data porque se adjuntan fotos.
    const fd = new FormData();
    fd.append("maquinaCodigo", maquinaCodigo);
    fd.append("descripcion", descripcion);
    fd.append("prioridad", prioridad);
    if (tipoFalla) fd.append("tipoFalla", tipoFalla);
    fotos.forEach((f) => fd.append("fotos", f));
    try {
      const res = await api.post<Incidencia>("/incidencias", fd);
      setCreada(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <Layout titulo="Incidencia enviada" volver="/operario">
        <div className="aviso aviso-ok">
          <strong>#INC-{creada.id} registrada</strong> · turno {creada.turno} · estado {creada.estado}.
          <br />Se notificó al líder de turno y al taller por correo (RN-09).
        </div>
        <button className="btn btn-primario" onClick={() => nav("/operario")}>Volver al inicio</button>
      </Layout>
    );
  }

  return (
    <Layout
      titulo="Reportar Incidencia"
      subtitulo="Mantenimiento GMP"
      volver="/operario"
      pie={
        <button className="btn btn-primario btn-grande" disabled={enviando} onClick={enviar}>
          {enviando ? "Enviando…" : "▶ Enviar reporte de incidencia"}
        </button>
      }
    >
      <section className="card">
        <div className="fila" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <label className="etiqueta" style={{ margin: 0 }}>
            Equipo afectado
          </label>
          <button
            type="button"
            className="chip-btn"
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--superficie-baja)",
              border: "1px solid var(--superficie-alta)",
            }}
            onClick={() => setEscanerAbierto(true)}
          >
            <span style={{ fontSize: "14px" }}>⌕</span>
            <strong>Escanear QR / Código</strong>
          </button>
        </div>

        <Estado cargando={maquinas.cargando} error={maquinas.error} />
        <select
          className="input"
          value={maquinaCodigo}
          onChange={(e) => {
            setMaquinaCodigo(e.target.value);
            setEscaneadaExito(false);
          }}
        >
          <option value="">Elegí o escaneá la máquina…</option>
          {maquinas.data?.map((m) => (
            <option key={m.codigo} value={m.codigo}>
              {m.nombre ?? m.codigo} ({m.codigo})
            </option>
          ))}
        </select>
        {maquina && (
          <div className="fila" style={{ marginTop: "4px" }}>
            <p className="muted" style={{ margin: 0 }}>
              {maquina.linea || "Línea general"} ·{" "}
              <span className="chip chip-ok">{maquina.estado}</span>
            </p>
            {escaneadaExito && (
              <span className="chip chip-ok" style={{ fontSize: "11px" }}>
                ✓ Escaneada exitosamente
              </span>
            )}
          </div>
        )}
      </section>

      <section>
        <label className="etiqueta">Nivel de prioridad</label>
        <div className="grid-2">
          <button className={`opcion ${prioridad === "normal" ? "activa" : ""}`} onClick={() => setPrioridad("normal")}>
            <strong>Normal</strong><small>Intervención de rutina</small>
          </button>
          <button className={`opcion opcion-urgente ${prioridad === "urgente" ? "activa" : ""}`} onClick={() => setPrioridad("urgente")}>
            <strong>▲ Urgente</strong><small>Riesgo / Parada</small>
          </button>
        </div>
      </section>

      <SelectorFotos fotos={fotos} onFotosChange={setFotos} maxFotos={3} />

      <section className="card">
        <label className="etiqueta">Falla detectada</label>
        <div className="chips">
          {FALLAS.map((f) => (
            <button key={f.valor} className={`chip-btn ${tipoFalla === f.valor ? "activa" : ""}`} onClick={() => setTipoFalla(f.valor)}>
              {f.texto}
            </button>
          ))}
        </div>
        <textarea
          className="input"
          rows={4}
          placeholder="Describí lo que pasó…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </section>

      {error && <p className="aviso aviso-error">{error}</p>}

      <ModalEscanerMaquina
        abierto={escanerAbierto}
        onCerrar={() => setEscanerAbierto(false)}
        onSeleccionar={(cod) => {
          setMaquinaCodigo(cod);
          setEscaneadaExito(true);
        }}
        maquinasDisponibles={maquinas.data ?? []}
      />
    </Layout>
  );
}
