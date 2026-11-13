import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { api, ApiError } from "../../api/client";
import { useApi } from "../../api/useApi";
import { useIncidencias } from "../../api/useIncidencias";
import type { AccionCorrectiva, EstadoMaquina, Reparacion, Repuesto, ResultadoLineaUso } from "../../api/tipos";

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
  const catalogo = useApi<Repuesto[]>("/repuestos");
  const { incidencias, cargando: cargandoInc, error: errorInc } = useIncidencias();

  // Buscamos la incidencia en la lista unificada
  const incData = incidencias.find((i) => i.id === Number(id));

  const [lineas, setLineas] = useState<Linea[]>([]);
  const [sinRepuestosConfirmado, setSinRepuestosConfirmado] = useState(false);
  const [codigoAgregar, setCodigoAgregar] = useState("");
  const [accion, setAccion] = useState<AccionCorrectiva>("reemplazo_pieza");
  const [notas, setNotas] = useState("");
  const [estadoMaquina, setEstadoMaquina] = useState<EstadoMaquina>("operativa");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ rep: Reparacion; alertas: number } | null>(null);

  function agregar() {
    if (codigoAgregar === "ninguno") {
      setSinRepuestosConfirmado(true);
      setLineas([]);
      setCodigoAgregar("");
      return;
    }
    const r = catalogo.data?.find((x) => x.codigo === codigoAgregar);
    if (!r || lineas.some((l) => l.repuesto.codigo === r.codigo)) return;
    setSinRepuestosConfirmado(false);
    setLineas([...lineas, { repuesto: r, cantidad: 1 }]);
    setCodigoAgregar("");
  }

  function eliminarLinea(codigo: string) {
    setLineas(lineas.filter((l) => l.repuesto.codigo !== codigo));
  }

  function cambiarCantidad(codigo: string, delta: number) {
    setLineas(lineas.map((l) => (l.repuesto.codigo === codigo ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l)));
  }

  /** Flujo del contrato: 1) POST /reparaciones  2) POST lineas-uso por cada repuesto  3) POST cierre */
  async function registrar() {
    if (lineas.length === 0 && !sinRepuestosConfirmado) {
      setError("Debes agregar al menos un repuesto utilizado o seleccionar 'Ninguno'.");
      return;
    }
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
        minutosIntervencion: 30, // valor por defecto para cumplir el schema del contrato
        accionCorrectiva: accion,
        notas,
        estadoMaquina,
      });
      // Guardar también en localStorage para el listado histórico de arreglos
      const arregloParaHistorial = {
        id: rep.id,
        incidenciaId: Number(id),
        maquina: incData?.maquina?.nombre ?? incData?.maquinaCodigo ?? "Máquina",
        fecha: new Date().toISOString(),
        accionCorrectiva: accion,
        notas,
        estadoMaquina,
        repuestosUtilizados: lineas.map((l) => ({
          codigo: l.repuesto.codigo,
          nombre: l.repuesto.nombre,
          cantidad: l.cantidad,
        })),
      };
      const guardados = JSON.parse(localStorage.getItem("historial_arreglos") ?? "[]");
      localStorage.setItem("historial_arreglos", JSON.stringify([arregloParaHistorial, ...guardados]));

      // Actualizar estado de la incidencia en localStorage según estado resultante del equipo
      const overrides: Record<string, string> = JSON.parse(localStorage.getItem("incidencias_estado_override") ?? "{}");
      if (estadoMaquina === "operativa") {
        overrides[String(id)] = "resuelta";
      } else if (estadoMaquina === "en_pruebas") {
        overrides[String(id)] = "en_cuarentena";
      } else if (estadoMaquina === "fuera_de_servicio") {
        overrides[String(id)] = "detenida";
      }
      localStorage.setItem("incidencias_estado_override", JSON.stringify(overrides));

      setResultado({ rep: cerrada, alertas });
    } catch (e) {
      // 409 STOCK_INSUFICIENTE (RN-01) o REPUESTO_RESERVADO (RN-05)
      setError(e instanceof ApiError ? `${e.codigo}: ${e.message}` : (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    const msgEstado =
      estadoMaquina === "operativa"
        ? "La incidencia fue marcada como resuelta."
        : estadoMaquina === "en_pruebas"
        ? "La maquina pasa a cuarentena. La incidencia queda en espera de aprobacion de Calidad."
        : "El equipo requirió parada / mantenimiento mayor. La incidencia queda activa como detenida.";

    return (
      <Layout titulo="Arreglo registrado" volver="/mantenimiento">
        <div className="aviso aviso-ok">
          Reparacion #{resultado.rep.id} cerrada. {lineas.length > 0 ? `Se descontó el stock de ${lineas.length} repuesto(s).` : "Sin repuestos utilizados."}
        </div>
        <div className="aviso">{msgEstado}</div>
        {resultado.alertas > 0 && (
          <div className="aviso aviso-error">
            {resultado.alertas} repuesto(s) quedaron bajo el umbral minimo: se genero alerta de reposicion (RN-02).
          </div>
        )}
        <button className="btn btn-primario" onClick={() => nav("/mantenimiento")}>Volver al inicio</button>
      </Layout>
    );
  }

  // Filtramos para mostrar únicamente los repuestos compatibles con esta máquina (si están asociados)
  const maquinaCodigo = incData?.maquinaCodigo;
  const repuestosFiltrados = catalogo.data?.filter((r) => {
    if (!r.maquinasCompatibles || r.maquinasCompatibles.length === 0) return true;
    return !maquinaCodigo || r.maquinasCompatibles.includes(maquinaCodigo);
  });

  return (
    <Layout
      titulo="Reportar Arreglo"
      subtitulo="Paso 2 de 2 · Resolución técnica"
      volver="/reparar"
      pie={
        <button
          className="btn btn-primario btn-grande"
          disabled={enviando || !incData || (lineas.length === 0 && !sinRepuestosConfirmado)}
          onClick={registrar}
        >
          {enviando ? "Registrando…" : "⊘ Registrar arreglo y descontar stock"}
        </button>
      }
    >
      <Estado cargando={cargandoInc} error={errorInc} />
      {incData && (
        <section
          className={`card borde-${incData.estado === "detenida" ? "neutro" : incData.prioridad === "urgente" ? "error" : "warn"}`}
          style={
            incData.estado === "detenida"
              ? { borderLeft: "5px solid #1e293b", background: "var(--superficie-baja)" }
              : undefined
          }
        >
          <div className="fila" style={{ justifyContent: "flex-start", gap: "0.5rem" }}>
            <span className={`chip ${incData.prioridad === "urgente" ? "chip-error" : "chip-warn"}`}>
              #INC-{incData.id} · {incData.prioridad}
            </span>
            {incData.estado === "detenida" && (
              <span
                className="chip"
                style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #475569" }}
              >
                Detenida / Parada
              </span>
            )}
          </div>
          <strong className="h3">{incData.maquina?.nombre ?? incData.maquinaCodigo}</strong>
          <small className="muted">{incData.maquina?.linea}</small>
          <p className="aviso aviso-error">⚠ {incData.descripcion}</p>
        </section>
      )}

      <section className="card">
        <h3 className="h3"><span className="num">1</span> Repuestos utilizados</h3>
        {lineas.map((l) => (
          <div key={l.repuesto.codigo} className="card card-interna">
            <div className="fila" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span className="chip chip-codigo">{l.repuesto.codigo}</span>
                <small className="muted">Disponible {l.repuesto.stockDisponible} uds</small>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => eliminarLinea(l.repuesto.codigo)}
                style={{
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.75rem",
                  color: "var(--error)",
                  borderColor: "var(--error)",
                  background: "transparent",
                }}
              >
                Eliminar
              </button>
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
        {sinRepuestosConfirmado && lineas.length === 0 && (
          <div className="aviso" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>No se utilizaron repuestos para esta reparación.</span>
            <button
              type="button"
              className="btn"
              onClick={() => setSinRepuestosConfirmado(false)}
              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
            >
              Cambiar
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", width: "100%", marginTop: "0.5rem" }}>
          <select
            className="input"
            value={codigoAgregar}
            onChange={(e) => setCodigoAgregar(e.target.value)}
            style={{ flex: 1, minWidth: 0, textOverflow: "ellipsis" }}
          >
            <option value="">Escanear / elegir repuesto…</option>
            <option value="ninguno">-- Ninguno (no se usó repuesto) --</option>
            {repuestosFiltrados?.map((r) => (
              <option key={r.codigo} value={r.codigo}>
                {r.codigo} · {r.nombre} (disp: {r.stockDisponible})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primario"
            onClick={agregar}
            disabled={!codigoAgregar}
            style={{ whiteSpace: "nowrap" }}
          >
            + Agregar
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="h3"><span className="num">2</span> Trabajo realizado</h3>
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
