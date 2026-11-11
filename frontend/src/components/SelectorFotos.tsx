import { useRef } from "react";

interface Props {
  fotos: File[];
  onFotosChange: (fotos: File[]) => void;
  maxFotos?: number;
}

export default function SelectorFotos({ fotos, onFotosChange, maxFotos = 3 }: Props) {
  // Input con capture="environment": en celulares abre directamente la cámara trasera nativa
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  // Input común para elegir de la galería/archivos
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const agregarArchivos = (nuevos: File[]) => {
    const combinadas = [...fotos, ...nuevos].slice(0, maxFotos);
    onFotosChange(combinadas);
  };

  const eliminarFoto = (indice: number) => {
    onFotosChange(fotos.filter((_, i) => i !== indice));
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <label className="etiqueta" style={{ margin: 0 }}>
          Evidencia visual ({fotos.length}/{maxFotos})
        </label>
        <small className="muted">Máximo {maxFotos} imágenes</small>
      </div>

      {/* Input estándar HTML5 para cámara nativa de celular:
          accept="image/*" + capture="environment" abre directo la app de cámara */}
      <input
        ref={inputCamaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            agregarArchivos(Array.from(e.target.files));
          }
          // Reset para permitir sacar otra foto con el mismo input
          e.target.value = "";
        }}
      />

      {/* Input para seleccionar de la galería o explorador de archivos */}
      <input
        ref={inputGaleriaRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            agregarArchivos(Array.from(e.target.files));
          }
          e.target.value = "";
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <button
          type="button"
          className="btn"
          onClick={() => inputCamaraRef.current?.click()}
          disabled={fotos.length >= maxFotos}
          style={{
            padding: "0.65rem 0.5rem",
            background: "var(--superficie-baja)",
            border: "1px solid var(--borde)",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Tomar foto
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => inputGaleriaRef.current?.click()}
          disabled={fotos.length >= maxFotos}
          style={{
            padding: "0.65rem 0.5rem",
            background: "var(--superficie-baja)",
            border: "1px solid var(--borde)",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Adjuntar archivo
        </button>
      </div>

      {/* Miniaturas de fotos tomadas */}
      {fotos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
          {fotos.map((f, i) => {
            const urlPreview = URL.createObjectURL(f);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: "1px solid var(--borde)",
                  aspectRatio: "1",
                }}
              >
                <img
                  src={urlPreview}
                  alt={`Evidencia ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onLoad={() => URL.revokeObjectURL(urlPreview)}
                />
                <button
                  type="button"
                  onClick={() => eliminarFoto(i)}
                  aria-label="Eliminar foto"
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    width: "20px",
                    height: "20px",
                    fontSize: "11px",
                    lineHeight: "1",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
