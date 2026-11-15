import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout, { Estado } from "../../components/Layout";
import { useRol } from "../../rol";
import { useApi } from "../../api/useApi";
import { api, ApiError } from "../../api/client";
import type { EstadoMaquina, Maquina, Repuesto } from "../../api/tipos";
import ModalEscanerMaquina from "../../components/ModalEscanerMaquina";
import ModalNuevaMaquina from "./ModalNuevaMaquina";
import ModalDetalleMaquina from "./ModalDetalleMaquina";

const FILTROS_ESTADO: { valor: string; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todas" },
  { valor: "operativa", etiqueta: "Operativas" },
  { valor: "en_pruebas", etiqueta: "En pruebas" },
  { valor: "en_mantenimiento", etiqueta: "En mantenimiento" },
  { valor: "fuera_de_servicio", etiqueta: "Fuera de servicio" },
];

export default function GestionMaquinaria() {
  const { rol } = useRol();

  // Restricción exclusiva al rol Encargado (Requisito 1)
  if (rol !== "encargado") {
    return <Navigate to="/" replace />;
  }

  // Datos desde backend
  const { data: maquinas, cargando, error, recargar } = useApi<Maquina[]>("/maquinas");
  const repuestosApi = useApi<Repuesto[]>("/repuestos");

  // Estado local para catálogo dinámico de repuestos (por si se dan de alta nuevos rápidamente)
  const [catalogoLocal, setCatalogoLocal] = useState<Repuesto[]>([]);
  const todosLosRepuestos = useMemo(() => {
    const base = repuestosApi.data ?? [];
    const codigosBase = new Set(base.map((r) => r.codigo));
    const extras = catalogoLocal.filter((r) => !codigosBase.has(r.codigo));
    return [...base, ...extras];
  }, [repuestosApi.data, catalogoLocal]);

  // Lista local de máquinas para reflejar updates inmediatos
  const [maquinasLocales, setMaquinasLocales] = useState<Maquina[] | null>(null);
  const listaMaquinas = maquinasLocales ?? (maquinas ?? []);

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modales
  const [modalAltaAbierto, setModalAltaAbierto] = useState(false);
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<Maquina | null>(null);
  const [escanerBusquedaAbierto, setEscanerBusquedaAbierto] = useState(false);

  // Mensaje de notificación global
  const [notificacion, setNotificacion] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  // Actualizar máquina en lista local
  function actualizarMaquinaLocal(m: Maquina) {
    setMaquinasLocales((prev) => {
      const actual = prev ?? (maquinas ?? []);
      const index = actual.findIndex((x) => x.codigo === m.codigo);
      if (index >= 0) {
        const copia = [...actual];
        copia[index] = m;
        return copia;
      }
      return [m, ...actual];
    });

    if (maquinaSeleccionada && maquinaSeleccionada.codigo === m.codigo) {
      setMaquinaSeleccionada(m);
    }
  }

  function handleMaquinaCreada(nueva: Maquina) {
    actualizarMaquinaLocal(nueva);
    setNotificacion({
      tipo: "ok",
      texto: `Máquina ${nueva.codigo} (${nueva.nombre || nueva.tipo}) registrada exitosamente.`,
    });
    setMaquinaSeleccionada(nueva);
  }

  function handleRepuestoNuevo(rep: Repuesto) {
    setCatalogoLocal((prev) => [rep, ...prev]);
  }

  async function cambiarEstadoRapido(m: Maquina, nuevoEstado: EstadoMaquina) {
    if (m.estado === nuevoEstado) return;
    try {
      const act = await api.patch<Maquina>(`/maquinas/${m.codigo}`, {
        estado: nuevoEstado,
      });
      actualizarMaquinaLocal(act);
      setNotificacion({
        tipo: "ok",
        texto: `Estado de ${m.codigo} actualizado a ${nuevoEstado.replace(/_/g, " ")}.`,
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al actualizar estado.";
      setNotificacion({ tipo: "error", texto: msg });
    }
  }

  // Filtrado en tiempo real (Requisito 2)
  const maquinasFiltradas = useMemo(() => {
    return listaMaquinas.filter((m) => {
      // Filtro de estado
      if (filtroEstado !== "todos" && m.estado !== filtroEstado) {
        return false;
      }

      // Buscador por código, tipo, ejemplar, nombre o línea
      if (busqueda.trim()) {
        const termino = busqueda.trim().toLowerCase();
        const coincideCodigo = m.codigo.toLowerCase().includes(termino);
        const coincideTipo = m.tipo.toLowerCase().includes(termino);
        const coincideEjemplar = m.ejemplar.toLowerCase().includes(termino);
        const coincideNombre = (m.nombre ?? "").toLowerCase().includes(termino);
        const coincideLinea = (m.linea ?? "").toLowerCase().includes(termino);

        if (
          !coincideCodigo &&
          !coincideTipo &&
          !coincideEjemplar &&
          !coincideNombre &&
          !coincideLinea
        ) {
          return false;
        }
      }

      return true;
    });
  }, [listaMaquinas, busqueda, filtroEstado]);

  // Contadores para KPIs
  const totalMaquinas = listaMaquinas.length;
  const operativas = listaMaquinas.filter((m) => m.estado === "operativa").length;
  const enMantenimiento = listaMaquinas.filter((m) => m.estado === "en_mantenimiento").length;
  const fueraServicio = listaMaquinas.filter((m) => m.estado === "fuera_de_servicio").length;
  const enPruebas = listaMaquinas.filter((m) => m.estado === "en_pruebas").length;

  return (
    <Layout
      titulo="Gestión de Maquinaria"
      subtitulo="Encargado · Parque de equipos y repuestos críticos (RN-07)"
      volver="/encargado"
    >
      {/* Alerta de notificación si hubo acción reciente */}
      {notificacion && (
        <div
          className={`aviso aviso-${notificacion.tipo}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{notificacion.texto}</span>
          <button
            type="button"
            className="icon-btn"
            style={{ width: "24px", height: "24px", fontSize: "14px" }}
            onClick={() => setNotificacion(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjeta de KPIs */}
      <div className="grid-2">
        <div className="card">
          <small className="etiqueta">Parque Total</small>
          <span className="kpi">{totalMaquinas}</span>
          <small className="muted">Máquinas registradas</small>
        </div>
        <div className="card">
          <div className="fila" style={{ gap: "4px" }}>
            <span className="chip chip-ok">{operativas} operativas</span>
            {enMantenimiento > 0 && (
              <span className="chip chip-warn">{enMantenimiento} en mant.</span>
            )}
            {fueraServicio > 0 && (
              <span className="chip chip-error">{fueraServicio} fuera serv.</span>
            )}
            {enPruebas > 0 && (
              <span className="chip">{enPruebas} en pruebas</span>
            )}
          </div>
          <small className="muted" style={{ marginTop: "4px" }}>
            Disponibilidad de planta activa
          </small>
        </div>
      </div>

      {/* Barra de acción: Alta de nueva máquina */}
      <div className="fila-titulo" style={{ marginTop: "4px" }}>
        <h2 className="h2">Parque de Maquinaria</h2>
        <button
          type="button"
          className="btn btn-primario"
          style={{ fontSize: "13px", padding: "10px 14px" }}
          onClick={() => setModalAltaAbierto(true)}
        >
          + Nueva Máquina (RN-07)
        </button>
      </div>

      {/* Buscador en tiempo real y Escáner QR (Requisito 2) */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          className="input"
          placeholder="⌕ Buscar por código (QR/barras), tipo, ejemplar, línea…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          type="button"
          className="btn"
          title="Escanear QR de máquina para filtrar"
          onClick={() => setEscanerBusquedaAbierto(true)}
          style={{ whiteSpace: "nowrap", padding: "10px 14px", fontSize: "13px" }}
        >
          ⌕ Escanear
        </button>
        {busqueda && (
          <button
            type="button"
            className="btn"
            onClick={() => setBusqueda("")}
            title="Limpiar búsqueda"
            style={{ padding: "10px 12px" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="chips" style={{ overflowX: "auto", paddingBottom: "4px" }}>
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.valor}
            type="button"
            className={`chip-btn ${filtroEstado === f.valor ? "activa" : ""}`}
            style={{ fontSize: "12px", padding: "6px 12px" }}
            onClick={() => setFiltroEstado(f.valor)}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      <Estado cargando={cargando} error={error} />

      {/* Listado de Máquinas */}
      {maquinasFiltradas.length === 0 && !cargando ? (
        <div className="card card-interna center" style={{ padding: "32px 16px" }}>
          <strong>No se encontraron máquinas</strong>
          <p className="muted" style={{ margin: "4px 0 12px" }}>
            {busqueda || filtroEstado !== "todos"
              ? "Probá ajustando el término de búsqueda o el filtro de estado."
              : "Aún no hay máquinas registradas en el sistema."}
          </p>
          <button
            type="button"
            className="btn btn-primario"
            style={{ alignSelf: "center" }}
            onClick={() => {
              setBusqueda("");
              setFiltroEstado("todos");
              setModalAltaAbierto(true);
            }}
          >
            + Registrar la primera máquina
          </button>
        </div>
      ) : (
        <div className="lista">
          {maquinasFiltradas.map((m) => {
            const cantRepuestos = m.repuestosAMantener?.length ?? 0;
            const bordeClase =
              m.estado === "operativa"
                ? "borde-ok"
                : m.estado === "en_mantenimiento"
                ? "borde-warn"
                : m.estado === "fuera_de_servicio"
                ? "borde-error"
                : "borde-neutro";

            const badgeEstadoClase =
              m.estado === "operativa"
                ? "chip-ok"
                : m.estado === "en_mantenimiento"
                ? "chip-warn"
                : m.estado === "fuera_de_servicio"
                ? "chip-error"
                : "";

            const textoEstado =
              m.estado === "operativa"
                ? "✓ OPERATIVA"
                : m.estado === "en_pruebas"
                ? "⚙ EN PRUEBAS"
                : m.estado === "en_mantenimiento"
                ? "▲ EN MANTENIMIENTO"
                : "✕ FUERA DE SERVICIO";

            return (
              <div
                key={m.codigo}
                className={`card ${bordeClase}`}
                style={{ cursor: "pointer", transition: "box-shadow 0.15s" }}
                onClick={() => setMaquinaSeleccionada(m)}
              >
                {/* Fila superior: Código y Estado */}
                <div className="fila">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="chip chip-codigo">⌕ {m.codigo}</span>
                    <span className="chip">Ejemplar: {m.ejemplar}</span>
                  </div>
                  <span className={`chip ${badgeEstadoClase}`}>{textoEstado}</span>
                </div>

                {/* Título y detalles */}
                <div>
                  <strong style={{ fontSize: "16px" }}>
                    {m.nombre || `${m.tipo} ${m.ejemplar}`}
                  </strong>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--texto-suave)",
                      marginTop: "2px",
                    }}
                  >
                    Tipo: <strong>{m.tipo}</strong>
                    {m.linea && ` · Ubicación: ${m.linea}`}
                  </div>
                </div>

                {/* Fila inferior: Repuestos vinculados y Botones */}
                <div
                  className="fila"
                  style={{
                    marginTop: "4px",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--superficie-baja)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="chip" title="Repuestos a mantener en stock para este equipo (RN-07)">
                    ▣ {cantRepuestos} repuesto{cantRepuestos !== 1 ? "s" : ""} a mantener
                  </span>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {/* Selector rápido de estado (Requisito 4) */}
                    <select
                      className="input"
                      style={{
                        padding: "6px 8px",
                        fontSize: "12px",
                        width: "auto",
                      }}
                      value={m.estado}
                      onChange={(e) =>
                        cambiarEstadoRapido(m, e.target.value as EstadoMaquina)
                      }
                      title="Cambiar estado operativo"
                    >
                      <option value="operativa">Operativa</option>
                      <option value="en_pruebas">En pruebas</option>
                      <option value="en_mantenimiento">En mantenimiento</option>
                      <option value="fuera_de_servicio">Fuera de servicio</option>
                    </select>

                    <button
                      type="button"
                      className="btn"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => setMaquinaSeleccionada(m)}
                    >
                      Detalle & Repuestos →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Máquina (Requisito 2 y 4) */}
      <ModalDetalleMaquina
        maquina={maquinaSeleccionada}
        abierto={Boolean(maquinaSeleccionada)}
        onCerrar={() => setMaquinaSeleccionada(null)}
        onMaquinaActualizada={actualizarMaquinaLocal}
        repuestosCatalogo={todosLosRepuestos}
        onRepuestoNuevoCatalogo={handleRepuestoNuevo}
      />

      {/* Modal de Alta de Máquina (Requisito 3) */}
      <ModalNuevaMaquina
        abierto={modalAltaAbierto}
        onCerrar={() => setModalAltaAbierto(false)}
        onCreada={handleMaquinaCreada}
        maquinasExistentes={listaMaquinas}
        repuestosCatalogo={todosLosRepuestos}
        onRepuestoNuevoCatalogo={handleRepuestoNuevo}
      />

      {/* Escáner para el buscador */}
      <ModalEscanerMaquina
        abierto={escanerBusquedaAbierto}
        onCerrar={() => setEscanerBusquedaAbierto(false)}
        onSeleccionar={(codigoLeido) => {
          setBusqueda(codigoLeido);
          const encontrada = listaMaquinas.find(
            (m) => m.codigo.toLowerCase() === codigoLeido.toLowerCase()
          );
          if (encontrada) {
            setMaquinaSeleccionada(encontrada);
          }
        }}
        maquinasDisponibles={listaMaquinas}
      />
    </Layout>
  );
}
