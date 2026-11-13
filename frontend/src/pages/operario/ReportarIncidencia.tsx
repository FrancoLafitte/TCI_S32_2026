import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import SelectorFotos from "../../components/SelectorFotos";
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
  const maquinas = useApi<Maquina[]>("/maquinas");

  const [maquinaCodigo, setMaquinaCodigo] = useState("");
  const [prioridad, setPrioridad] = useState<Urgencia>("normal");
  const [tipoFalla, setTipoFalla] = useState<TipoFalla | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<Incidencia | null>(null);

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
      // Generar un ID único para la nueva incidencia si el mock repite siempre el mismo
      const guardadas: Incidencia[] = JSON.parse(localStorage.getItem("incidencias_creadas_local") ?? "[]");
      const nuevoId = Math.max(300, ...guardadas.map((x) => x.id), res.id ?? 0) + 1;

      const nuevaIncidencia: Incidencia = {
        id: nuevoId,
        maquinaCodigo,
        maquina: maquina ? { codigo: maquina.codigo, nombre: maquina.nombre ?? maquina.codigo, linea: maquina.linea } : undefined,
        descripcion,
        tipoFalla: tipoFalla ?? undefined,
        prioridad,
        fotos: fotos.map((f) => f.name),
        estado: "abierta",
        turno: "manana",
        reportadaPor: localStorage.getItem("usuario_nombre") ?? "Operario",
        creadaEn: new Date().toISOString(),
      };

      localStorage.setItem("incidencias_creadas_local", JSON.stringify([nuevaIncidencia, ...guardadas]));
      setCreada(nuevaIncidencia);
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
          {enviando ? "Enviando…" : "➤ Enviar reporte de incidencia"}
        </button>
      }
    >
      <section className="card">
        <label className="etiqueta">Equipo afectado</label>
        <Estado cargando={maquinas.cargando} error={maquinas.error} />
        <select className="input" value={maquinaCodigo} onChange={(e) => setMaquinaCodigo(e.target.value)}>
          <option value="">Elegí o escaneá la máquina…</option>
          {maquinas.data?.map((m) => (
            <option key={m.codigo} value={m.codigo}>{m.nombre ?? m.codigo}</option>
          ))}
        </select>
        {maquina && <p className="muted">{maquina.linea} · <span className="chip chip-ok">{maquina.estado}</span></p>}
      </section>

      <section>
        <label className="etiqueta">Nivel de prioridad</label>
        <div className="grid-2">
          <button className={`opcion ${prioridad === "normal" ? "activa" : ""}`} onClick={() => setPrioridad("normal")}>
            <strong>Normal</strong><small>Intervención de rutina</small>
          </button>
          <button className={`opcion opcion-urgente ${prioridad === "urgente" ? "activa" : ""}`} onClick={() => setPrioridad("urgente")}>
            <strong>⚠ Urgente</strong><small>Riesgo / Parada</small>
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
      <p className="aviso">✉ Notificación automática al Líder de Turno y al Taller vía correo.</p>
    </Layout>
  );
}
