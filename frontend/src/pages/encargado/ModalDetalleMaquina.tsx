import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/client";
import type { EstadoMaquina, Maquina, Repuesto } from "../../api/tipos";
import ModalNuevoRepuestoRapido from "./ModalNuevoRepuestoRapido";

type Props = {
  maquina: Maquina | null;
  abierto: boolean;
  onCerrar: () => void;
  onMaquinaActualizada: (maquina: Maquina) => void;
  repuestosCatalogo: Repuesto[];
  onRepuestoNuevoCatalogo: (rep: Repuesto) => void;
};

const ESTADOS: { valor: EstadoMaquina; etiqueta: string; chipClase: string }[] = [
  { valor: "operativa", etiqueta: "✓ Operativa", chipClase: "chip-ok" },
  { valor: "en_pruebas", etiqueta: "⚙ En pruebas", chipClase: "" },
  { valor: "en_mantenimiento", etiqueta: "▲ En mantenimiento", chipClase: "chip-warn" },
  { valor: "fuera_de_servicio", etiqueta: "✕ Fuera de servicio", chipClase: "chip-error" },
];

export default function ModalDetalleMaquina({
  maquina,
  abierto,
  onCerrar,
  onMaquinaActualizada,
  repuestosCatalogo,
  onRepuestoNuevoCatalogo,
}: Props) {
  const [repuestosDetallados, setRepuestosDetallados] = useState<Repuesto[]>([]);
  const [cargandoRepuestos, setCargandoRepuestos] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Vincular repuesto
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [mostrarModalNuevoRepuesto, setMostrarModalNuevoRepuesto] = useState(false);

  useEffect(() => {
    if (!abierto || !maquina) {
      setRepuestosDetallados([]);
      setMensaje(null);
      return;
    }

    cargarRepuestosDeMaquina(maquina.codigo);
  }, [abierto, maquina?.codigo]);

  async function cargarRepuestosDeMaquina(codMaquina: string) {
    setCargandoRepuestos(true);
    try {
      const data = await api.get<Repuesto[]>(`/maquinas/${codMaquina}/repuestos`);
      setRepuestosDetallados(data);
    } catch {
      // Fallback a filtrar del catálogo si la llamada directa fallara
      const codigosAsociados = maquina?.repuestosAMantener ?? [];
      const filtrados = repuestosCatalogo.filter((r) =>
        codigosAsociados.includes(r.codigo)
      );
      setRepuestosDetallados(filtrados);
    } finally {
      setCargandoRepuestos(false);
    }
  }

  async function cambiarEstado(nuevoEstado: EstadoMaquina) {
    if (!maquina || maquina.estado === nuevoEstado) return;
    setActualizandoEstado(true);
    setMensaje(null);

    try {
      const actualizada = await api.patch<Maquina>(`/maquinas/${maquina.codigo}`, {
        estado: nuevoEstado,
      });
      onMaquinaActualizada(actualizada);
      setMensaje({
        tipo: "ok",
        texto: `Estado de ${maquina.codigo} cambiado a ${nuevoEstado.replace(/_/g, " ")}.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al cambiar estado.";
      setMensaje({ tipo: "error", texto: msg });
    } finally {
      setActualizandoEstado(false);
    }
  }

  async function handleVincularRepuesto() {
    if (!maquina || !repuestoSeleccionado) return;
    setVinculando(true);
    setMensaje(null);

    try {
      const actualizada = await api.post<Maquina>(`/maquinas/${maquina.codigo}/repuestos`, {
        repuestoCodigo: repuestoSeleccionado,
      });
      onMaquinaActualizada(actualizada);
      setRepuestoSeleccionado("");
      await cargarRepuestosDeMaquina(maquina.codigo);
      setMensaje({
        tipo: "ok",
        texto: `Repuesto ${repuestoSeleccionado} vinculado correctamente a la máquina.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al vincular repuesto.";
      setMensaje({ tipo: "error", texto: msg });
    } finally {
      setVinculando(false);
    }
  }

  async function handleQuitarRepuesto(codRepuesto: string) {
    if (!maquina) return;
    const seguro = window.confirm(
      `¿Confirmás desvincular el repuesto ${codRepuesto} de la lista de esta máquina?`
    );
    if (!seguro) return;

    setMensaje(null);
    try {
      const actualizada = await api.delete<Maquina>(
        `/maquinas/${maquina.codigo}/repuestos/${codRepuesto}`
      );
      onMaquinaActualizada(actualizada);
      setRepuestosDetallados((prev) => prev.filter((r) => r.codigo !== codRepuesto));
      setMensaje({
        tipo: "ok",
        texto: `Repuesto ${codRepuesto} desvinculado de la máquina.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al desvincular repuesto.";
      setMensaje({ tipo: "error", texto: msg });
    }
  }

  if (!abierto || !maquina) return null;

  const codigosYaAsociados = (maquina.repuestosAMantener ?? []).concat(
    repuestosDetallados.map((r) => r.codigo)
  );
  const repuestosDisponiblesParaVincular = repuestosCatalogo.filter(
    (r) => !codigosYaAsociados.includes(r.codigo)
  );

  const estadoActualConfig =
    ESTADOS.find((e) => e.valor === maquina.estado) ?? ESTADOS[0];

  return (
    <>
      <div className="modal-overlay" onClick={onCerrar}>
        <div
          className="modal-contenedor"
          style={{ maxWidth: "600px", maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div>
              <strong>{maquina.nombre || maquina.tipo}</strong>
              <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                <span className="chip chip-codigo">{maquina.codigo}</span>
                <span className="chip">Ejemplar: {maquina.ejemplar}</span>
                {maquina.linea && <span className="chip">{maquina.linea}</span>}
              </div>
            </div>
            <button
              type="button"
              className="icon-btn"
              style={{ width: "32px", height: "32px", fontSize: "16px" }}
              onClick={onCerrar}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Mensajes de feedback */}
            {mensaje && (
              <div
                className={`aviso aviso-${mensaje.tipo}`}
                style={{ fontWeight: 600 }}
              >
                {mensaje.texto}
              </div>
            )}

            {/* Gestión de Estado (Requisito 4) */}
            <div
              style={{
                background: "var(--superficie-baja)",
                padding: "14px",
                borderRadius: "var(--radio)",
                border: "1px solid var(--superficie-alta)",
              }}
            >
              <div className="fila-titulo" style={{ marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "13px" }}>Estado Operativo de la Máquina</strong>
                  <small className="muted" style={{ display: "block" }}>
                    Actualizar disponibilidad operativa del equipo
                  </small>
                </div>
                <span className={`chip ${estadoActualConfig.chipClase}`}>
                  {estadoActualConfig.etiqueta}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {ESTADOS.map((est) => (
                  <button
                    key={est.valor}
                    type="button"
                    className={`btn ${
                      maquina.estado === est.valor ? "btn-primario" : ""
                    }`}
                    style={{
                      fontSize: "12px",
                      padding: "8px 10px",
                      textAlign: "center",
                    }}
                    disabled={actualizandoEstado || maquina.estado === est.valor}
                    onClick={() => cambiarEstado(est.valor)}
                  >
                    {est.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Repuestos a mantener (RN-07) */}
            <div
              style={{
                background: "var(--superficie-baja)",
                padding: "14px",
                borderRadius: "var(--radio)",
                border: "1px solid var(--superficie-alta)",
              }}
            >
              <div className="fila-titulo" style={{ marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "14px" }}>
                    Repuestos Críticos a Mantener en Stock (RN-07)
                  </strong>
                  <small className="muted" style={{ display: "block" }}>
                    {repuestosDetallados.length} repuestos vinculados a este equipo
                  </small>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() => setMostrarModalNuevoRepuesto(true)}
                >
                  + Nuevo en Catálogo
                </button>
              </div>

              {/* Vincular repuesto existente */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <select
                  className="input"
                  style={{ fontSize: "13px" }}
                  value={repuestoSeleccionado}
                  onChange={(e) => setRepuestoSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccionar repuesto del catálogo --</option>
                  {repuestosDisponiblesParaVincular.map((r) => (
                    <option key={r.codigo} value={r.codigo}>
                      {r.codigo} · {r.nombre} (Mín: {r.umbralMinimo} | Disp: {r.stockDisponible})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primario"
                  style={{ whiteSpace: "nowrap", padding: "8px 14px", fontSize: "13px" }}
                  disabled={!repuestoSeleccionado || vinculando}
                  onClick={handleVincularRepuesto}
                >
                  {vinculando ? "Vinculando…" : "+ Vincular"}
                </button>
              </div>

              {/* Lista detallada de repuestos vinculados */}
              {cargandoRepuestos ? (
                <p className="muted center" style={{ fontSize: "13px" }}>
                  Cargando repuestos vinculados…
                </p>
              ) : repuestosDetallados.length === 0 ? (
                <div
                  className="card card-interna center"
                  style={{ padding: "16px", margin: "4px 0" }}
                >
                  <p className="muted" style={{ margin: 0, fontSize: "13px" }}>
                    No hay repuestos vinculados a esta máquina.
                  </p>
                  <small className="muted">
                    Vincular repuestos asegura el control de stock crítico según la regla RN-07.
                  </small>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {repuestosDetallados.map((rep) => {
                    const bajoUmbral = rep.stockDisponible <= rep.umbralMinimo;
                    return (
                      <div
                        key={rep.codigo}
                        className={`card card-interna ${
                          bajoUmbral ? "borde-warn" : "borde-ok"
                        }`}
                        style={{ padding: "12px" }}
                      >
                        <div className="fila">
                          <div>
                            <span className="chip chip-codigo">{rep.codigo}</span>
                            <strong style={{ marginLeft: "6px", fontSize: "14px" }}>
                              {rep.nombre}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className="btn"
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              color: "var(--error)",
                            }}
                            onClick={() => handleQuitarRepuesto(rep.codigo)}
                            title="Quitar vínculo de este repuesto"
                          >
                            ✕ Quitar
                          </button>
                        </div>

                        <div
                          className="fila"
                          style={{ marginTop: "6px", fontSize: "12px" }}
                        >
                          <div>
                            <span className="muted">Stock disponible: </span>
                            <strong
                              style={{
                                color: bajoUmbral ? "var(--error)" : "var(--ok)",
                              }}
                            >
                              {rep.stockDisponible} ud
                            </strong>{" "}
                            <span className="muted">
                              (Mínimo requerido: {rep.umbralMinimo} ud)
                            </span>
                          </div>

                          <div className="chips">
                            {bajoUmbral ? (
                              <span className="chip chip-warn">
                                ▲ Bajo umbral de seguridad
                              </span>
                            ) : (
                              <span className="chip chip-ok">✓ Stock adecuado</span>
                            )}
                            <span className="chip">
                              ⚑ Ubic: {rep.ubicacion?.codigo}
                              {rep.ubicacion?.descripcion
                                ? ` (${rep.ubicacion.descripcion})`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear un nuevo repuesto en catálogo */}
      <ModalNuevoRepuestoRapido
        abierto={mostrarModalNuevoRepuesto}
        onCerrar={() => setMostrarModalNuevoRepuesto(false)}
        onCreado={async (nuevoRep) => {
          onRepuestoNuevoCatalogo(nuevoRep);
          if (maquina) {
            try {
              const act = await api.post<Maquina>(`/maquinas/${maquina.codigo}/repuestos`, {
                repuestoCodigo: nuevoRep.codigo,
              });
              onMaquinaActualizada(act);
              await cargarRepuestosDeMaquina(maquina.codigo);
              setMensaje({
                tipo: "ok",
                texto: `Repuesto ${nuevoRep.codigo} creado y vinculado a la máquina.`,
              });
            } catch {
              // ya creado en catálogo
            }
          }
        }}
      />
    </>
  );
}
