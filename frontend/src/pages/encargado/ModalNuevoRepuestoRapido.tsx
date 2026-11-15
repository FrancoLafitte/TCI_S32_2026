import { useState } from "react";
import { api, ApiError } from "../../api/client";
import type { Repuesto } from "../../api/tipos";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: (repuesto: Repuesto) => void;
};

export default function ModalNuevoRepuestoRapido({
  abierto,
  onCerrar,
  onCreado,
}: Props) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [umbralMinimo, setUmbralMinimo] = useState(5);
  const [ubicacionCodigo, setUbicacionCodigo] = useState("A-01-01");
  const [ubicacionDesc, setUbicacionDesc] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState(0);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setError("El código y el nombre del repuesto son obligatorios.");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const nuevo = await api.post<Repuesto>("/repuestos", {
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        umbralMinimo: Number(umbralMinimo) || 0,
        precioUnitario: Number(precioUnitario) || 0,
        ubicacion: {
          codigo: ubicacionCodigo.trim().toUpperCase() || "A-01-01",
          descripcion: ubicacionDesc.trim() || undefined,
        },
      });

      // Limpiar formulario y notificar
      setCodigo("");
      setNombre("");
      setDescripcion("");
      setUmbralMinimo(5);
      setPrecioUnitario(0);
      onCreado(nuevo);
      onCerrar();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al registrar el repuesto.");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-contenedor"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <strong>+ Registrar Nuevo Repuesto en Catálogo</strong>
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

          <div>
            <label className="etiqueta">Código de Repuesto * (QR / Barras)</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: REP-8801"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="etiqueta">Nombre de Repuesto *</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Junta Sanitaria Clamp 1.5''"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="etiqueta">Descripción (opcional)</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Silicona curada en platino grado farmacéutico"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div>
              <label className="etiqueta">Umbral Mínimo (RN-02) *</label>
              <input
                type="number"
                min="0"
                className="input"
                value={umbralMinimo}
                onChange={(e) => setUmbralMinimo(parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div>
              <label className="etiqueta">Precio Unitario (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label className="etiqueta">Ubicación Código *</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: B-02-14"
                value={ubicacionCodigo}
                onChange={(e) => setUbicacionCodigo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="etiqueta">Detalle Ubicación</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Estante B, fila 2"
                value={ubicacionDesc}
                onChange={(e) => setUbicacionDesc(e.target.value)}
              />
            </div>
          </div>

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
              {guardando ? "Guardando…" : "Crear Repuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
