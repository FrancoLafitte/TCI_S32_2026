import { useState, useId } from "react";
import { api, ApiError } from "../../api/client";
import type { Maquina, Repuesto, EstadoMaquina } from "../../api/tipos";
import ModalEscanerMaquina from "../../components/ModalEscanerMaquina";
import ModalNuevoRepuestoRapido from "./ModalNuevoRepuestoRapido";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onCreada: (maquina: Maquina) => void;
  maquinasExistentes: Maquina[];
  repuestosCatalogo: Repuesto[];
  onRepuestoNuevoCatalogo: (rep: Repuesto) => void;
};

const TIPOS_PREDEFINIDOS = [
  "Fraccionador",
  "Caldera",
  "Banda de Transporte",
  "Envasadora Rotativa",
  "Autoclave",
  "Compresor de Aire",
  "Reactor Químico",
  "Liofilizador",
  "Etiquetadora",
  "Blistera",
  "Otro",
];

export default function ModalNuevaMaquina({
  abierto,
  onCerrar,
  onCreada,
  maquinasExistentes,
  repuestosCatalogo,
  onRepuestoNuevoCatalogo,
}: Props) {
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState("Fraccionador");
  const [tipoPersonalizado, setTipoPersonalizado] = useState("");
  const [ejemplar, setEjemplar] = useState("");
  const [nombre, setNombre] = useState("");
  const [linea, setLinea] = useState("");
  const [estado, setEstado] = useState<EstadoMaquina>("operativa");

  // Lista de repuestos seleccionados para mantener en stock (RN-07)
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState<string[]>([]);
  const [repuestoParaAgregar, setRepuestoParaAgregar] = useState("");

  // Modales secundarios
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [mostrarModalNuevoRepuesto, setMostrarModalNuevoRepuesto] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  const tipoFinal = tipo === "Otro" ? tipoPersonalizado.trim() : tipo;

  // Sugerir nombre automáticamente si el usuario no escribió uno manual
  function manejarCambioEjemplar(val: string) {
    setEjemplar(val);
    if (!nombre || nombre === `${tipoFinal} ${ejemplar}`.trim()) {
      setNombre(val ? `${tipoFinal} ${val}`.trim() : tipoFinal);
    }
  }

  function generarCodigoSugerido() {
    const prefijo = tipoFinal ? tipoFinal.slice(0, 3).toUpperCase() : "MAQ";
    const ejLimpio = ejemplar.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const sugerido = `MAQ-${prefijo}${ejLimpio ? `-${ejLimpio}` : `-${Math.floor(100 + Math.random() * 900)}`}`;
    setCodigo(sugerido);
  }

  function agregarRepuestoALista(repCod: string) {
    const cod = repCod.trim();
    if (!cod) return;
    if (!repuestosSeleccionados.includes(cod)) {
      setRepuestosSeleccionados([...repuestosSeleccionados, cod]);
    }
    setRepuestoParaAgregar("");
  }

  function removerRepuestoDeLista(repCod: string) {
    setRepuestosSeleccionados(repuestosSeleccionados.filter((c) => c !== repCod));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const codLimpio = codigo.trim().toUpperCase();

    if (!codLimpio) {
      setError("El código único de la máquina es obligatorio.");
      return;
    }
    if (!tipoFinal) {
      setError("Debes indicar el tipo o modelo de la máquina.");
      return;
    }
    if (!ejemplar.trim()) {
      setError("Debes indicar el número o identificador de ejemplar.");
      return;
    }

    // Validación de unicidad en frontend
    const yaExiste = maquinasExistentes.some(
      (m) => m.codigo.toLowerCase() === codLimpio.toLowerCase()
    );
    if (yaExiste) {
      setError(`Ya existe una máquina registrada con el código ${codLimpio}.`);
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const nueva = await api.post<Maquina>("/maquinas", {
        codigo: codLimpio,
        nombre: nombre.trim() || `${tipoFinal} ${ejemplar.trim()}`,
        tipo: tipoFinal,
        ejemplar: ejemplar.trim(),
        linea: linea.trim() || undefined,
        estado,
        repuestosAMantener: repuestosSeleccionados,
      });

      // Limpiar y notificar
      setCodigo("");
      setEjemplar("");
      setNombre("");
      setLinea("");
      setEstado("operativa");
      setRepuestosSeleccionados([]);
      onCreada(nueva);
      onCerrar();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error inesperado al registrar la máquina.");
      }
    } finally {
      setGuardando(false);
    }
  }

  const repuestosDisponiblesParaAgregar = repuestosCatalogo.filter(
    (r) => !repuestosSeleccionados.includes(r.codigo)
  );

  return (
    <>
      <div className="modal-overlay" onClick={onCerrar}>
        <div
          className="modal-contenedor"
          style={{ maxWidth: "560px", maxHeight: "92vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <strong>+ Alta de Nueva Máquina (RN-07)</strong>
            <button
              type="button"
              className="icon-btn"
              style={{ width: "32px", height: "32px", fontSize: "16px" }}
              onClick={onCerrar}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            {error && <div className="aviso aviso-error">{error}</div>}

            {/* Código QR / de Barras */}
            <div>
              <label className="etiqueta">Código Único (QR / Placa / Barras) *</label>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: MAQ-F05 o escanear QR…"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  required
                />
                <button
                  type="button"
                  className="btn"
                  title="Escanear etiqueta QR con la cámara"
                  onClick={() => setMostrarEscaner(true)}
                  style={{ whiteSpace: "nowrap", padding: "10px 14px", fontSize: "13px" }}
                >
                  ⌕ Escanear QR
                </button>
                <button
                  type="button"
                  className="btn"
                  title="Generar código sugerido"
                  onClick={generarCodigoSugerido}
                  style={{ whiteSpace: "nowrap", padding: "10px 12px", fontSize: "12px" }}
                >
                  ⚡ Sugerir
                </button>
              </div>
            </div>

            {/* Tipo / Modelo */}
            <div className="grid-2">
              <div>
                <label className="etiqueta">Tipo / Modelo *</label>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    const t = e.target.value === "Otro" ? tipoPersonalizado : e.target.value;
                    if (ejemplar) setNombre(`${t} ${ejemplar}`.trim());
                  }}
                >
                  {TIPOS_PREDEFINIDOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="etiqueta">Ejemplar / Unidad *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: F-05 o 2"
                  value={ejemplar}
                  onChange={(e) => manejarCambioEjemplar(e.target.value)}
                  required
                />
              </div>
            </div>

            {tipo === "Otro" && (
              <div>
                <label className="etiqueta">Especificar Tipo *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Granuladora Lecho Fluido"
                  value={tipoPersonalizado}
                  onChange={(e) => {
                    setTipoPersonalizado(e.target.value);
                    if (ejemplar) setNombre(`${e.target.value} ${ejemplar}`.trim());
                  }}
                  required
                />
              </div>
            )}

            {/* Nombre y Línea */}
            <div className="grid-2">
              <div>
                <label className="etiqueta">Nombre Descriptivo</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Fraccionador F-05"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="etiqueta">Línea / Sala en Planta</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Línea 2 - Envasado"
                  value={linea}
                  onChange={(e) => setLinea(e.target.value)}
                />
              </div>
            </div>

            {/* Estado Inicial */}
            <div>
              <label className="etiqueta">Estado Operativo Inicial</label>
              <select
                className="input"
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoMaquina)}
              >
                <option value="operativa">✓ Operativa (Activa para producción)</option>
                <option value="en_pruebas">⚙ En pruebas (Calibración / Puesta a punto)</option>
                <option value="en_mantenimiento">▲ En mantenimiento preventivo</option>
                <option value="fuera_de_servicio">✕ Fuera de servicio</option>
              </select>
            </div>

            {/* Sección RN-07: Lista de Repuestos a Mantener */}
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
                    Lista de Repuestos a Mantener en Stock (RN-07)
                  </strong>
                  <small className="muted" style={{ display: "block" }}>
                    Definí los repuestos críticos necesarios para este equipo
                  </small>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "11px", padding: "6px 10px" }}
                  onClick={() => setMostrarModalNuevoRepuesto(true)}
                >
                  + Nuevo en catálogo
                </button>
              </div>

              {/* Selector de repuesto existente */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <select
                  className="input"
                  style={{ fontSize: "13px" }}
                  value={repuestoParaAgregar}
                  onChange={(e) => setRepuestoParaAgregar(e.target.value)}
                >
                  <option value="">-- Seleccionar repuesto del catálogo --</option>
                  {repuestosDisponiblesParaAgregar.map((r) => (
                    <option key={r.codigo} value={r.codigo}>
                      {r.codigo} · {r.nombre} (Mín: {r.umbralMinimo} ud | Disp: {r.stockDisponible})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primario"
                  style={{ whiteSpace: "nowrap", padding: "8px 14px", fontSize: "13px" }}
                  disabled={!repuestoParaAgregar}
                  onClick={() => agregarRepuestoALista(repuestoParaAgregar)}
                >
                  + Agregar
                </button>
              </div>

              {/* Lista de repuestos seleccionados */}
              {repuestosSeleccionados.length === 0 ? (
                <p className="muted center" style={{ fontSize: "12px", margin: "8px 0" }}>
                  Aún no vinculaste repuestos a esta máquina. Podés agregarlos ahora o posteriormente.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {repuestosSeleccionados.map((cod) => {
                    const rep = repuestosCatalogo.find((r) => r.codigo === cod);
                    return (
                      <div
                        key={cod}
                        className="fila"
                        style={{
                          background: "var(--superficie)",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          <strong>{cod}</strong> · {rep ? rep.nombre : "Repuesto"}
                          {rep && (
                            <div style={{ fontSize: "11px", color: "var(--texto-suave)" }}>
                              Umbral mín: <strong>{rep.umbralMinimo} ud</strong> | Disp:{" "}
                              {rep.stockDisponible} ud | Ubic: {rep.ubicacion?.codigo}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{
                            width: "28px",
                            height: "28px",
                            fontSize: "13px",
                            color: "var(--error)",
                          }}
                          onClick={() => removerRepuestoDeLista(cod)}
                          title="Quitar repuesto de la lista"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="fila" style={{ marginTop: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn"
                onClick={onCerrar}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primario"
                disabled={guardando}
              >
                {guardando ? "Registrando máquina…" : "Registrar Máquina"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Escáner QR de máquina */}
      <ModalEscanerMaquina
        abierto={mostrarEscaner}
        onCerrar={() => setMostrarEscaner(false)}
        onSeleccionar={(codigoLeido) => {
          setCodigo(codigoLeido.toUpperCase());
        }}
        maquinasDisponibles={maquinasExistentes}
      />

      {/* Alta rápida de nuevo repuesto en catálogo */}
      <ModalNuevoRepuestoRapido
        abierto={mostrarModalNuevoRepuesto}
        onCerrar={() => setMostrarModalNuevoRepuesto(false)}
        onCreado={(nuevoRep) => {
          onRepuestoNuevoCatalogo(nuevoRep);
          agregarRepuestoALista(nuevoRep.codigo);
        }}
      />
    </>
  );
}
