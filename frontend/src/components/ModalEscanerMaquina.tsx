import { useEffect, useRef, useState } from "react";
import type { Maquina } from "../api/tipos";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onSeleccionar: (codigo: string) => void;
  maquinasDisponibles: Maquina[];
};

export default function ModalEscanerMaquina({
  abierto,
  onCerrar,
  onSeleccionar,
  maquinasDisponibles,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [codigoManual, setCodigoManual] = useState("");
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [detectando, setDetectando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  function detenerCamara() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function procesarLectura(textoBruto: string) {
    if (!textoBruto) return;
    const limpio = textoBruto.trim();

    // 1. Extraer si es una URL con parámetro maquina=...
    let codigoBuscado = limpio;
    try {
      if (limpio.startsWith("http://") || limpio.startsWith("https://")) {
        const url = new URL(limpio);
        const param = url.searchParams.get("maquina");
        if (param) codigoBuscado = param;
      }
    } catch {
      // No es URL válida, usar texto directo
    }

    // 2. Buscar coincidencia en la lista de máquinas
    const maquina = maquinasDisponibles.find(
      (m) =>
        m.codigo.toLowerCase() === codigoBuscado.toLowerCase() ||
        (m.nombre && m.nombre.toLowerCase() === codigoBuscado.toLowerCase())
    );

    if (maquina) {
      setMensajeExito(`¡Máquina ${maquina.codigo} detectada!`);
      detenerCamara();
      setTimeout(() => {
        onSeleccionar(maquina.codigo);
        onCerrar();
      }, 500);
    } else {
      // Si el código tiene formato de máquina, asignarlo de todos modos
      setMensajeExito(`Código escaneado: ${codigoBuscado}`);
      detenerCamara();
      setTimeout(() => {
        onSeleccionar(codigoBuscado);
        onCerrar();
      }, 500);
    }
  }

  useEffect(() => {
    if (!abierto) {
      detenerCamara();
      setMensajeExito(null);
      setErrorCamara(null);
      return;
    }

    let intervalId: any = null;

    async function iniciarCamara() {
      try {
        setErrorCamara(null);
        if (!navigator.mediaDevices?.getUserMedia) {
          setErrorCamara("Tu navegador no soporta acceso a la cámara.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Si el navegador soporta la API nativa BarcodeDetector (Chrome/Android)
        if ("BarcodeDetector" in window) {
          setDetectando(true);
          const detector = new (window as any).BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13"],
          });

          intervalId = setInterval(async () => {
            if (
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              !videoRef.current.paused
            ) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  procesarLectura(barcodes[0].rawValue);
                }
              } catch {
                // frame no procesable
              }
            }
          }, 350);
        }
      } catch (err) {
        setErrorCamara(
          "No se pudo acceder a la cámara. Podés ingresar el código o seleccionar una etiqueta debajo."
        );
      }
    }

    iniciarCamara();

    return () => {
      detenerCamara();
      if (intervalId) clearInterval(intervalId);
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <strong>⌕ Escáner QR de Máquina</strong>
          <button
            type="button"
            className="icon-btn"
            style={{ width: "32px", height: "32px", fontSize: "16px" }}
            onClick={onCerrar}
            aria-label="Cerrar escáner"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Mensaje de confirmación cuando se escaneó */}
          {mensajeExito && (
            <div className="aviso aviso-ok center" style={{ fontWeight: 700 }}>
              ✓ {mensajeExito}
            </div>
          )}

          {/* Visor de cámara en vivo */}
          {!errorCamara ? (
            <div className="scanner-viewport">
              <video ref={videoRef} playsInline muted />
              <div className="scanner-mira">
                <div className="scanner-linea" />
              </div>
            </div>
          ) : (
            <div className="aviso aviso-warn" style={{ fontSize: "13px" }}>
              {errorCamara}
            </div>
          )}

          <small className="muted center">
            Apuntá la cámara a la etiqueta QR o código de barras de la máquina.
          </small>

          {/* Ingreso manual o por lector de código de barras USB/Bluetooth */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (codigoManual.trim()) {
                procesarLectura(codigoManual);
              }
            }}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              type="text"
              className="input"
              placeholder="Ingresar código manual o pistola lectora…"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              style={{ fontSize: "13px", padding: "10px" }}
            />
            <button
              type="submit"
              className="btn btn-primario"
              style={{ whiteSpace: "nowrap", padding: "10px 14px", fontSize: "13px" }}
            >
              Aplicar
            </button>
          </form>

          {/* Selector rápido de simulación de etiquetas QR en planta */}
          <div style={{ marginTop: "4px" }}>
            <small className="etiqueta" style={{ marginBottom: "6px" }}>
              Etiquetas QR registradas en planta (acceso rápido):
            </small>
            <div className="chips" style={{ maxHeight: "120px", overflowY: "auto" }}>
              {maquinasDisponibles.map((m) => (
                <button
                  key={m.codigo}
                  type="button"
                  className="chip-btn"
                  style={{ fontSize: "12px", padding: "6px 10px" }}
                  onClick={() => procesarLectura(m.codigo)}
                >
                  <strong>{m.codigo}</strong> · {m.nombre || m.tipo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
