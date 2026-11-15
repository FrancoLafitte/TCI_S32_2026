import { useState, useMemo } from "react";
import Layout, { Estado } from "../../components/Layout";
import { useApi } from "../../api/useApi";
import type {
  Incidencia,
  Maquina,
  PedidoCompra,
  Reparacion,
  Repuesto,
  Reserva,
  ResumenTablero,
} from "../../api/tipos";

type SeccionGerencia =
  | "tablero"
  | "maquinarias"
  | "incidencias"
  | "stock"
  | "calendario"
  | "reportes";

const SECCIONES: Record<SeccionGerencia, { titulo: string; icono: string }> = {
  tablero: { titulo: "Tablero Principal", icono: "▦" },
  maquinarias: { titulo: "Maquinarias", icono: "⚙" },
  incidencias: { titulo: "Incidencias", icono: "▲" },
  stock: { titulo: "Stock y Compras", icono: "▣" },
  calendario: { titulo: "Calendario", icono: "◷" },
  reportes: { titulo: "Reportes", icono: "▥" },
};

const TURNO = { manana: "Mañana", tarde: "Tarde", noche: "Noche" } as const;

export default function PanelGerencia() {
  const [seccion, setSeccion] = useState<SeccionGerencia>("tablero");
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Consultas de datos
  const resumen = useApi<ResumenTablero>("/tablero/resumen");
  const maquinas = useApi<Maquina[]>("/maquinas");
  const incidencias = useApi<Incidencia[]>("/incidencias");
  const pedidos = useApi<PedidoCompra[]>("/pedidos-compra");
  const repuestos = useApi<Repuesto[]>("/repuestos");
  const reservas = useApi<Reserva[]>("/reservas");
  const reparaciones = useApi<Reparacion[]>("/reparaciones");

  const r = resumen.data;
  const listaRepuestos = repuestos.data ?? [];
  const criticos = listaRepuestos.filter((x) => x.stockDisponible <= x.umbralMinimo);
  const cargandoGeneral =
    resumen.cargando &&
    maquinas.cargando &&
    incidencias.cargando &&
    pedidos.cargando;
  const errorGeneral =
    resumen.error || maquinas.error || incidencias.error || pedidos.error;

  return (
    <Layout
      titulo="Panel Gerencia y Administración"
      subtitulo="Supervisión integral de planta · Solo lectura"
      ancho
    >
      <Estado cargando={cargandoGeneral} error={errorGeneral} />

      <div className="gerencia-layout">
        {/* CONTENEDOR DEL MENÚ DE GERENCIA */}
        <div className="gerencia-nav-container">
          {/* BOTÓN HAMBURGUESA PARA VISTA MOBILE */}
          <button
            type="button"
            className="gerencia-hamburguesa-btn"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Abrir o cerrar menú de gerencia"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="hamburguesa-icono">{menuAbierto ? "✕" : "☰"}</span>
              <span className="hamburguesa-seccion">
                <span className="nav-icon">{SECCIONES[seccion].icono}</span>
                <strong>{SECCIONES[seccion].titulo}</strong>
              </span>
            </div>
            <span className="hamburguesa-flecha">{menuAbierto ? "▲" : "▼"}</span>
          </button>

          {/* SIDEBAR DE OPCIONES (En mobile se despliega con la hamburguesa) */}
          <aside className={`gerencia-sidebar ${menuAbierto ? "abierto" : ""}`}>
            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "tablero" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("tablero");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">▦</span>
              <span>Tablero Principal</span>
            </button>

            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "maquinarias" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("maquinarias");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">⚙</span>
              <span>Maquinarias</span>
              {(maquinas.data?.filter((m) => m.estado !== "operativa").length ?? 0) > 0 && (
                <span className="nav-badge" style={{ background: "#c76c00", color: "#fff" }}>
                  {maquinas.data?.filter((m) => m.estado !== "operativa").length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "incidencias" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("incidencias");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">▲</span>
              <span>Incidencias</span>
              {(r?.incidenciasActivas ?? 0) > 0 && (
                <span className="nav-badge">{r?.incidenciasActivas}</span>
              )}
            </button>

            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "stock" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("stock");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">▣</span>
              <span>Stock y Compras</span>
              {(r?.repuestosBajoUmbral ?? 0) > 0 && (
                <span className="nav-badge">{r?.repuestosBajoUmbral}</span>
              )}
            </button>

            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "calendario" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("calendario");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">◷</span>
              <span>Calendario</span>
              {(r?.reservasActivas ?? 0) > 0 && (
                <span className="nav-badge" style={{ background: "#006c4a", color: "#fff" }}>
                  {r?.reservasActivas}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`gerencia-nav-item ${seccion === "reportes" ? "activo" : ""}`}
              onClick={() => {
                setSeccion("reportes");
                setMenuAbierto(false);
              }}
            >
              <span className="nav-icon">▥</span>
              <span>Reportes</span>
            </button>
          </aside>
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN SECCIÓN */}
        <section className="gerencia-contenido">
          {seccion === "tablero" && (
            <SeccionTablero
              resumen={r}
              incidencias={incidencias.data ?? []}
              pedidos={pedidos.data ?? []}
              criticos={criticos}
              maquinas={maquinas.data ?? []}
            />
          )}

          {seccion === "maquinarias" && (
            <SeccionMaquinarias maquinas={maquinas.data ?? []} />
          )}

          {seccion === "incidencias" && (
            <SeccionIncidencias incidencias={incidencias.data ?? []} />
          )}

          {seccion === "stock" && (
            <SeccionStock repuestos={listaRepuestos} pedidos={pedidos.data ?? []} />
          )}

          {seccion === "calendario" && (
            <SeccionCalendario
              reservas={reservas.data ?? []}
              reparaciones={reparaciones.data ?? []}
            />
          )}

          {seccion === "reportes" && (
            <SeccionReportes
              maquinas={maquinas.data ?? []}
              incidencias={incidencias.data ?? []}
              reparaciones={reparaciones.data ?? []}
              pedidos={pedidos.data ?? []}
            />
          )}
        </section>
      </div>
    </Layout>
  );
}

/* =========================================================================
   1. TABLERO PRINCIPAL
   ========================================================================= */
function SeccionTablero({
  resumen,
  incidencias,
  pedidos,
  criticos,
  maquinas,
}: {
  resumen?: ResumenTablero | null;
  incidencias: Incidencia[];
  pedidos: PedidoCompra[];
  criticos: Repuesto[];
  maquinas: Maquina[];
}) {
  const maquinasOperativas = maquinas.filter((m) => m.estado === "operativa").length;
  const tasaOperativa =
    maquinas.length > 0 ? Math.round((maquinasOperativas / maquinas.length) * 100) : 100;

  return (
    <div className="lista">
      {/* KPIs Principales */}
      <div className="grid-kpi-4">
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">Incidencias activas</small>
          <span className="kpi">{resumen?.incidenciasActivas ?? "–"}</span>
          <small className="texto-error">{resumen?.incidenciasUrgentes ?? 0} urgentes</small>
        </div>
        <div className="card borde-warn card-kpi-compacta">
          <small className="etiqueta">Repuestos bajo umbral</small>
          <span className="kpi">{resumen?.repuestosBajoUmbral ?? "–"}</span>
          <small className="muted">{criticos.length} críticos identificados</small>
        </div>
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">Pedidos de compra</small>
          <span className="kpi">{resumen?.pedidosPendientes ?? "–"}</span>
          <small className="texto-error">{resumen?.pedidosUrgentes ?? 0} urgentes</small>
        </div>
        <div className="card borde-ok card-kpi-compacta">
          <small className="etiqueta">Operatividad parque</small>
          <span className="kpi">{tasaOperativa}%</span>
          <small className="muted">
            {maquinasOperativas} de {maquinas.length} máquinas
          </small>
        </div>
      </div>

      <div className="grid-gerencia">
        {/* Triage de incidencias activas */}
        <section className="card">
          <div className="fila-titulo">
            <h2 className="h3">Triage de incidencias activas</h2>
            <span className="chip">{incidencias.filter((i) => i.estado !== "resuelta").length} abiertas</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Línea</th>
                  <th>Turno</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {incidencias
                  .filter((i) => i.estado !== "resuelta")
                  .slice(0, 6)
                  .map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.maquina?.nombre || i.maquinaCodigo}</strong>
                        <br />
                        <small className="muted">#INC-{i.id}</small>
                      </td>
                      <td>{i.maquina?.linea || "Línea general"}</td>
                      <td>
                        <span className="chip">{TURNO[i.turno]}</span>
                      </td>
                      <td>
                        <span
                          className={`chip ${
                            i.prioridad === "urgente" ? "chip-error" : ""
                          }`}
                        >
                          {i.prioridad}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`chip ${
                            i.estado === "en_cuarentena"
                              ? "chip-warn"
                              : i.estado === "en_reparacion"
                              ? "chip-codigo"
                              : "chip-error"
                          }`}
                        >
                          {i.estado.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                {incidencias.filter((i) => i.estado !== "resuelta").length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted center" style={{ padding: "20px" }}>
                      No hay incidencias activas en este momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Resumen lateral: Stock en alerta y compras */}
        <div className="lista">
          <section className="card">
            <h2 className="h3">Stock crítico & reorden</h2>
            {criticos.length === 0 ? (
              <p className="muted" style={{ margin: "10px 0" }}>
                Todo el stock se encuentra por encima del umbral mínimo.
              </p>
            ) : (
              criticos.slice(0, 4).map((x) => (
                <div key={x.codigo} className="card card-interna">
                  <div className="fila">
                    <strong>{x.nombre}</strong>
                    <span className="chip chip-error">Cód: {x.codigo}</span>
                  </div>
                  <small className="muted">
                    Stock {x.stockDisponible} / Umbral Mín {x.umbralMinimo}
                  </small>
                  <div className="barra">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          (x.stockDisponible / Math.max(1, x.umbralMinimo)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card">
            <h2 className="h3">Pedidos de compra recientes</h2>
            <div style={{ overflowX: "auto" }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Urgencia</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.slice(0, 4).map((p) => (
                    <tr key={p.id}>
                      <td>#OC-{p.id}</td>
                      <td>
                        <span
                          className={`chip ${
                            p.urgencia === "urgente" ? "chip-error" : ""
                          }`}
                        >
                          {p.urgencia}
                        </span>
                      </td>
                      <td>${p.montoEstimado?.toLocaleString("es-AR") ?? "–"}</td>
                      <td>
                        <span
                          className={`chip ${
                            p.estado === "recibido" ? "chip-ok" : ""
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted center">
                        No hay pedidos de compra registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. MAQUINARIAS
   ========================================================================= */
function SeccionMaquinarias({ maquinas }: { maquinas: Maquina[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");

  const maquinasFiltradas = useMemo(() => {
    return maquinas.filter((m) => {
      const coincideBusqueda =
        (m.nombre ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        m.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (m.linea ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        m.tipo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado =
        filtroEstado === "todas" ? true : m.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [maquinas, busqueda, filtroEstado]);

  const operativas = maquinas.filter((m) => m.estado === "operativa").length;
  const enPruebas = maquinas.filter((m) => m.estado === "en_pruebas").length;
  const enMantenimiento = maquinas.filter((m) => m.estado === "en_mantenimiento").length;
  const fueraDeServicio = maquinas.filter((m) => m.estado === "fuera_de_servicio").length;

  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case "operativa":
        return <span className="chip chip-ok">Operativa</span>;
      case "en_pruebas":
        return (
          <span
            className="chip"
            style={{ background: "#ffdcc3", color: "#c76c00", fontWeight: 700 }}
          >
            En pruebas (Cuarentena)
          </span>
        );
      case "en_mantenimiento":
        return <span className="chip chip-codigo">En mantenimiento</span>;
      case "fuera_de_servicio":
        return <span className="chip chip-error">Fuera de servicio</span>;
      default:
        return <span className="chip">{estado}</span>;
    }
  };

  return (
    <div className="lista">
      <div className="grid-kpi-4">
        <div className="card borde-ok card-kpi-compacta">
          <small className="etiqueta">Operativas</small>
          <span className="kpi">{operativas}</span>
          <small className="muted">En línea</small>
        </div>
        <div className="card borde-warn card-kpi-compacta">
          <small className="etiqueta">En pruebas</small>
          <span className="kpi">{enPruebas}</span>
          <small className="muted">Validación</small>
        </div>
        <div className="card borde-neutro card-kpi-compacta">
          <small className="etiqueta">En mant.</small>
          <span className="kpi">{enMantenimiento}</span>
          <small className="muted">Intervención</small>
        </div>
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">Fuera de serv.</small>
          <span className="kpi">{fueraDeServicio}</span>
          <small className="texto-error">Detenida</small>
        </div>
      </div>

      <section className="card">
        <div className="fila-titulo">
          <h2 className="h3">Parque de Maquinarias ({maquinasFiltradas.length})</h2>
        </div>

        {/* Filtros */}
        <div className="fila" style={{ gap: "10px", margin: "8px 0" }}>
          <input
            type="search"
            className="input"
            placeholder="Buscar por código, nombre o línea..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ maxWidth: "340px" }}
          />

          <div className="chips">
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "todas" ? "activa" : ""}`}
              onClick={() => setFiltroEstado("todas")}
            >
              Todas
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "operativa" ? "activa" : ""}`}
              onClick={() => setFiltroEstado("operativa")}
            >
              Operativas
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "en_pruebas" ? "activa" : ""}`}
              onClick={() => setFiltroEstado("en_pruebas")}
            >
              En pruebas
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "fuera_de_servicio" ? "activa" : ""}`}
              onClick={() => setFiltroEstado("fuera_de_servicio")}
            >
              Fuera de servicio
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Ejemplar</th>
                <th>Línea</th>
                <th>Repuestos a Mantener</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {maquinasFiltradas.map((m) => (
                <tr key={m.codigo}>
                  <td>
                    <strong>{m.codigo}</strong>
                  </td>
                  <td>{m.nombre || m.codigo}</td>
                  <td>{m.tipo}</td>
                  <td>{m.ejemplar}</td>
                  <td>{m.linea || "–"}</td>
                  <td>
                    <div className="chips">
                      {m.repuestosAMantener && m.repuestosAMantener.length > 0 ? (
                        m.repuestosAMantener.map((rCod) => (
                          <span key={rCod} className="chip chip-codigo">
                            {rCod}
                          </span>
                        ))
                      ) : (
                        <span className="muted">Sin repuestos asignados</span>
                      )}
                    </div>
                  </td>
                  <td>{renderBadgeEstado(m.estado)}</td>
                </tr>
              ))}
              {maquinasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted center" style={{ padding: "20px" }}>
                    No se encontraron máquinas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   3. INCIDENCIAS
   ========================================================================= */
function SeccionIncidencias({ incidencias }: { incidencias: Incidencia[] }) {
  const [pagina, setPagina] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");

  const porPagina = 5;

  const filtradas = useMemo(() => {
    return [...incidencias]
      .sort((a, b) => b.id - a.id)
      .filter((i) => {
        const coincideEstado =
          filtroEstado === "todas" ? true : i.estado === filtroEstado;
        const coincidePrioridad =
          filtroPrioridad === "todas" ? true : i.prioridad === filtroPrioridad;
        const texto = `${i.id} ${i.maquinaCodigo} ${i.maquina?.nombre ?? ""} ${
          i.descripcion
        }`.toLowerCase();
        const coincideBusqueda = texto.includes(busqueda.toLowerCase());
        return coincideEstado && coincidePrioridad && coincideBusqueda;
      });
  }, [incidencias, filtroEstado, filtroPrioridad, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const actuales = filtradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="lista">
      {/* Resumen numérico */}
      <div className="grid-kpi-3">
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">Total</small>
          <span className="kpi">{incidencias.length}</span>
          <small className="texto-error">
            {incidencias.filter((i) => i.prioridad === "urgente").length} urgentes
          </small>
        </div>
        <div className="card borde-warn card-kpi-compacta">
          <small className="etiqueta">Abiertas</small>
          <span className="kpi">
            {incidencias.filter((i) => i.estado !== "resuelta").length}
          </span>
          <small className="muted">En proceso</small>
        </div>
        <div className="card borde-ok card-kpi-compacta">
          <small className="etiqueta">Resueltas</small>
          <span className="kpi">
            {incidencias.filter((i) => i.estado === "resuelta").length}
          </span>
          <small className="muted">Cerradas</small>
        </div>
      </div>

      <section className="card">
        <div className="fila-titulo">
          <h2 className="h3">Triage y Supervisión de Incidencias</h2>
        </div>

        {/* Barra de Filtros */}
        <div className="fila" style={{ gap: "10px", margin: "10px 0" }}>
          <input
            type="search"
            className="input"
            placeholder="Buscar por descripción, máquina o ID..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            style={{ maxWidth: "320px" }}
          />

          <div className="chips">
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "todas" ? "activa" : ""}`}
              onClick={() => {
                setFiltroEstado("todas");
                setPagina(1);
              }}
            >
              Todas
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "abierta" ? "activa" : ""}`}
              onClick={() => {
                setFiltroEstado("abierta");
                setPagina(1);
              }}
            >
              Abiertas
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "en_reparacion" ? "activa" : ""}`}
              onClick={() => {
                setFiltroEstado("en_reparacion");
                setPagina(1);
              }}
            >
              En reparación
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "en_cuarentena" ? "activa" : ""}`}
              onClick={() => {
                setFiltroEstado("en_cuarentena");
                setPagina(1);
              }}
            >
              En cuarentena
            </button>
            <button
              type="button"
              className={`chip-btn ${filtroEstado === "resuelta" ? "activa" : ""}`}
              onClick={() => {
                setFiltroEstado("resuelta");
                setPagina(1);
              }}
            >
              Resueltas
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Máquina</th>
                <th>Turno</th>
                <th>Falla / Descripción</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha de Registro</th>
              </tr>
            </thead>
            <tbody>
              {actuales.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>#INC-{i.id}</strong>
                  </td>
                  <td>
                    <strong>{i.maquina?.nombre || i.maquinaCodigo}</strong>
                    <br />
                    <small className="muted">{i.maquina?.linea || i.maquinaCodigo}</small>
                  </td>
                  <td>
                    <span className="chip">{TURNO[i.turno]}</span>
                  </td>
                  <td style={{ maxWidth: "260px" }}>
                    <div style={{ fontWeight: 600 }}>
                      {i.tipoFalla ? i.tipoFalla.replace("_", " ") : "Falla general"}
                    </div>
                    <small className="muted">{i.descripcion}</small>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        i.prioridad === "urgente" ? "chip-error" : ""
                      }`}
                    >
                      {i.prioridad}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        i.estado === "resuelta"
                          ? "chip-ok"
                          : i.estado === "en_cuarentena"
                          ? "chip-warn"
                          : i.estado === "en_reparacion"
                          ? "chip-codigo"
                          : "chip-error"
                      }`}
                    >
                      {i.estado.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <small className="muted">
                      {new Date(i.creadaEn).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </td>
                </tr>
              ))}
              {actuales.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted center" style={{ padding: "20px" }}>
                    No se encontraron incidencias que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              className="btn"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span className="muted" style={{ fontSize: "14px" }}>
              Página {pagina} de {totalPaginas} ({filtradas.length} resultados)
            </span>
            <button
              type="button"
              className="btn"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================================
   4. STOCK Y COMPRAS
   ========================================================================= */
function SeccionStock({
  repuestos,
  pedidos,
}: {
  repuestos: Repuesto[];
  pedidos: PedidoCompra[];
}) {
  const [subVista, setSubVista] = useState<"stock" | "compras">("stock");
  const [filtroBajoUmbral, setFiltroBajoUmbral] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const repuestosFiltrados = useMemo(() => {
    return repuestos.filter((r) => {
      const coincideTexto =
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.codigo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideUmbral = filtroBajoUmbral
        ? r.stockDisponible <= r.umbralMinimo
        : true;
      return coincideTexto && coincideUmbral;
    });
  }, [repuestos, busqueda, filtroBajoUmbral]);

  const criticos = repuestos.filter((r) => r.stockDisponible <= r.umbralMinimo);
  const pedidosPendientes = pedidos.filter((p) => p.estado === "pendiente");
  const gastoComprometido = pedidosPendientes.reduce(
    (acc, p) => acc + (p.montoEstimado || 0),
    0
  );

  return (
    <div className="lista">
      {/* Resumen superior */}
      <div className="grid-kpi-3">
        <div className="card borde-warn card-kpi-compacta">
          <small className="etiqueta">Bajo umbral</small>
          <span className="kpi">{criticos.length}</span>
          <small className="muted">Críticos</small>
        </div>
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">OC Pendientes</small>
          <span className="kpi">{pedidosPendientes.length}</span>
          <small className="texto-error">
            {pedidosPendientes.filter((p) => p.urgencia === "urgente").length} urgentes
          </small>
        </div>
        <div className="card borde-neutro card-kpi-compacta">
          <small className="etiqueta">Comprometido</small>
          <span className="kpi-chico" style={{ marginTop: "4px" }}>
            ${gastoComprometido.toLocaleString("es-AR")}
          </span>
          <small className="muted">Órdenes activas</small>
        </div>
      </div>

      {/* Selector de subvista */}
      <div className="chips" style={{ margin: "4px 0" }}>
        <button
          type="button"
          className={`chip-btn ${subVista === "stock" ? "activa" : ""}`}
          onClick={() => setSubVista("stock")}
        >
          ▣ Repuestos y Stock ({repuestos.length})
        </button>
        <button
          type="button"
          className={`chip-btn ${subVista === "compras" ? "activa" : ""}`}
          onClick={() => setSubVista("compras")}
        >
          ▤ Órdenes de Compra ({pedidos.length})
        </button>
      </div>

      {subVista === "stock" ? (
        <section className="card">
          <div className="fila-titulo">
            <h2 className="h3">Nivel de Stock y Alertas de Repuestos</h2>
          </div>

          <div className="fila" style={{ gap: "10px", margin: "10px 0" }}>
            <input
              type="search"
              className="input"
              placeholder="Buscar por código o nombre de repuesto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ maxWidth: "340px" }}
            />
            <div className="chips">
              <button
                type="button"
                className={`chip-btn ${!filtroBajoUmbral ? "activa" : ""}`}
                onClick={() => setFiltroBajoUmbral(false)}
              >
                Todos los Repuestos
              </button>
              <button
                type="button"
                className={`chip-btn ${filtroBajoUmbral ? "activa" : ""}`}
                onClick={() => setFiltroBajoUmbral(true)}
              >
                ▲ Solo Bajo Umbral Mínimo ({criticos.length})
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Físico</th>
                  <th>Reservado</th>
                  <th>Disponible</th>
                  <th>Umbral Mín</th>
                  <th>Ubicación</th>
                  <th>Estado Stock</th>
                </tr>
              </thead>
              <tbody>
                {repuestosFiltrados.map((r) => {
                  const esCritico = r.stockDisponible <= r.umbralMinimo;
                  const ratio = Math.min(
                    100,
                    Math.round((r.stockDisponible / Math.max(1, r.umbralMinimo)) * 100)
                  );
                  return (
                    <tr key={r.codigo}>
                      <td>
                        <strong>{r.codigo}</strong>
                      </td>
                      <td>
                        {r.nombre}
                        {r.descripcion && (
                          <>
                            <br />
                            <small className="muted">{r.descripcion}</small>
                          </>
                        )}
                      </td>
                      <td>{r.stockFisico}</td>
                      <td>{r.stockReservado}</td>
                      <td>
                        <strong>{r.stockDisponible}</strong>
                      </td>
                      <td>{r.umbralMinimo}</td>
                      <td>{r.ubicacion?.codigo || "–"}</td>
                      <td style={{ minWidth: "120px" }}>
                        <span
                          className={`chip ${
                            esCritico ? "chip-error" : "chip-ok"
                          }`}
                        >
                          {esCritico ? "Bajo Umbral" : "Normal"}
                        </span>
                        <div className="barra" style={{ marginTop: "4px" }}>
                          <span
                            style={{
                              width: `${ratio}%`,
                              background: esCritico ? "var(--error)" : "var(--ok)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {repuestosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={8} className="muted center" style={{ padding: "20px" }}>
                      No se encontraron repuestos con los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="fila-titulo">
            <h2 className="h3">Órdenes y Pedidos de Compra</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Urgencia</th>
                  <th>Líneas Solicitadas</th>
                  <th>Monto Estimado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>#OC-{p.id}</strong>
                    </td>
                    <td>
                      <small className="muted">
                        {new Date(p.creadoEn).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          p.urgencia === "urgente" ? "chip-error" : ""
                        }`}
                      >
                        {p.urgencia}
                      </span>
                    </td>
                    <td>
                      <div className="chips">
                        {p.lineas.map((l) => (
                          <span key={l.repuestoCodigo} className="chip chip-codigo">
                            {l.repuestoCodigo}: {l.cantidad} u.
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <strong>${p.montoEstimado?.toLocaleString("es-AR") ?? "–"}</strong>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          p.estado === "recibido"
                            ? "chip-ok"
                            : p.estado === "cancelado"
                            ? "chip-error"
                            : "chip-warn"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted center" style={{ padding: "20px" }}>
                      No hay pedidos de compra registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================================
   5. CALENDARIO
   ========================================================================= */
function SeccionCalendario({
  reservas,
  reparaciones,
}: {
  reservas: Reserva[];
  reparaciones: Reparacion[];
}) {
  const [tab, setTab] = useState<"reservas" | "reparaciones">("reservas");

  return (
    <div className="lista">
      {/* Resumen */}
      <div className="grid-kpi-2">
        <div className="card borde-ok card-kpi-compacta">
          <small className="etiqueta">Reservas Activas</small>
          <span className="kpi">
            {reservas.filter((r) => r.estado === "activa").length}
          </span>
          <small className="muted">Para mantenimiento</small>
        </div>
        <div className="card borde-neutro card-kpi-compacta">
          <small className="etiqueta">Reparaciones</small>
          <span className="kpi">{reparaciones.length}</span>
          <small className="muted">Intervenciones técnicas</small>
        </div>
      </div>

      <div className="chips">
        <button
          type="button"
          className={`chip-btn ${tab === "reservas" ? "activa" : ""}`}
          onClick={() => setTab("reservas")}
        >
          ◷ Reservas Preventivas ({reservas.length})
        </button>
        <button
          type="button"
          className={`chip-btn ${tab === "reparaciones" ? "activa" : ""}`}
          onClick={() => setTab("reparaciones")}
        >
          ⚙ Intervenciones Técnicas ({reparaciones.length})
        </button>
      </div>

      {tab === "reservas" ? (
        <section className="card">
          <div className="fila-titulo">
            <h2 className="h3">Reservas de Repuestos para Mantenimiento</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Máquina</th>
                  <th>Motivo</th>
                  <th>Repuestos Apartados</th>
                  <th>Solicitado Por</th>
                  <th>Urgencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <strong>#RES-{res.id}</strong>
                    </td>
                    <td>{res.maquinaCodigo || "General"}</td>
                    <td>{res.motivo}</td>
                    <td>
                      <div className="chips">
                        {res.lineas.map((l) => (
                          <span key={l.repuestoCodigo} className="chip chip-codigo">
                            {l.repuestoCodigo} ({l.cantidad} u.)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{res.solicitadaPor || "Técnico"}</td>
                    <td>
                      <span
                        className={`chip ${
                          res.urgencia === "urgente" ? "chip-error" : ""
                        }`}
                      >
                        {res.urgencia || "normal"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          res.estado === "activa"
                            ? "chip-ok"
                            : res.estado === "ejecutada"
                            ? "chip-codigo"
                            : "chip-warn"
                        }`}
                      >
                        {res.estado}
                      </span>
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted center" style={{ padding: "20px" }}>
                      No hay reservas registradas en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="fila-titulo">
            <h2 className="h3">Registro de Intervenciones Técnicas</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Incidencia</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Cierre</th>
                  <th>Tiempo</th>
                  <th>Acción Correctiva</th>
                  <th>Estado Resultante</th>
                </tr>
              </thead>
              <tbody>
                {reparaciones.map((rep) => (
                  <tr key={rep.id}>
                    <td>
                      <strong>#REP-{rep.id}</strong>
                    </td>
                    <td>
                      <span className="chip">#INC-{rep.incidenciaId}</span>
                    </td>
                    <td>
                      <small className="muted">
                        {new Date(rep.iniciadaEn).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </td>
                    <td>
                      <small className="muted">
                        {rep.cerradaEn
                          ? new Date(rep.cerradaEn).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "En curso"}
                      </small>
                    </td>
                    <td>
                      {rep.minutosIntervencion ? (
                        <strong>{rep.minutosIntervencion} min</strong>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>
                      {rep.accionCorrectiva ? (
                        <span className="chip chip-codigo">
                          {rep.accionCorrectiva.replace("_", " ")}
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td>
                      {rep.estadoMaquina ? (
                        <span
                          className={`chip ${
                            rep.estadoMaquina === "operativa"
                              ? "chip-ok"
                              : rep.estadoMaquina === "en_pruebas"
                              ? "chip-warn"
                              : "chip-error"
                          }`}
                        >
                          {rep.estadoMaquina.replace("_", " ")}
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                  </tr>
                ))}
                {reparaciones.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted center" style={{ padding: "20px" }}>
                      No hay reparaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================================
   6. REPORTES
   ========================================================================= */
function SeccionReportes({
  maquinas,
  incidencias,
  reparaciones,
  pedidos,
}: {
  maquinas: Maquina[];
  incidencias: Incidencia[];
  reparaciones: Reparacion[];
  pedidos: PedidoCompra[];
}) {
  // MTTR (Mean Time to Repair en minutos)
  const reparacionesCerradas = reparaciones.filter(
    (r) => r.minutosIntervencion && r.minutosIntervencion > 0
  );
  const mttr =
    reparacionesCerradas.length > 0
      ? Math.round(
          reparacionesCerradas.reduce(
            (acc, r) => acc + (r.minutosIntervencion || 0),
            0
          ) / reparacionesCerradas.length
        )
      : 0;

  // Desglose por tipo de falla
  const conteoFallas: Record<string, number> = {};
  for (const inc of incidencias) {
    const f = inc.tipoFalla || "otro";
    conteoFallas[f] = (conteoFallas[f] || 0) + 1;
  }

  // Desglose por turno
  const conteoTurno: Record<string, number> = { manana: 0, tarde: 0, noche: 0 };
  for (const inc of incidencias) {
    conteoTurno[inc.turno] = (conteoTurno[inc.turno] || 0) + 1;
  }

  // Top máquinas con incidencias
  const conteoMaquinas: Record<string, number> = {};
  for (const inc of incidencias) {
    conteoMaquinas[inc.maquinaCodigo] = (conteoMaquinas[inc.maquinaCodigo] || 0) + 1;
  }
  const rankingMaquinas = Object.entries(conteoMaquinas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Inversión en compras
  const totalComprasRecibidas = pedidos
    .filter((p) => p.estado === "recibido")
    .reduce((acc, p) => acc + (p.montoEstimado || 0), 0);
  const totalComprasPendientes = pedidos
    .filter((p) => p.estado === "pendiente")
    .reduce((acc, p) => acc + (p.montoEstimado || 0), 0);

  return (
    <div className="lista">
      <div className="grid-kpi-4">
        <div className="card borde-ok card-kpi-compacta">
          <small className="etiqueta">MTTR Promedio</small>
          <span className="kpi">{mttr} min</span>
          <small className="muted">Resolución técnica</small>
        </div>
        <div className="card borde-warn card-kpi-compacta">
          <small className="etiqueta">Incidencias</small>
          <span className="kpi">{incidencias.length}</span>
          <small className="muted">
            {incidencias.filter((i) => i.estado === "resuelta").length} resueltas
          </small>
        </div>
        <div className="card borde-neutro card-kpi-compacta">
          <small className="etiqueta">Inv. Recibida</small>
          <span className="kpi-chico" style={{ marginTop: "4px" }}>
            ${totalComprasRecibidas.toLocaleString("es-AR")}
          </span>
          <small className="muted">Incorporada</small>
        </div>
        <div className="card borde-error card-kpi-compacta">
          <small className="etiqueta">Comprometido</small>
          <span className="kpi-chico" style={{ marginTop: "4px" }}>
            ${totalComprasPendientes.toLocaleString("es-AR")}
          </span>
          <small className="texto-error">En pedidos</small>
        </div>
      </div>

      <div className="grid-2">
        {/* Desglose por tipo de falla */}
        <section className="card">
          <h2 className="h3">Distribución por Tipo de Falla</h2>
          <div className="lista" style={{ gap: "8px", marginTop: "8px" }}>
            {Object.entries(conteoFallas).map(([tipo, cant]) => {
              const porcentaje = Math.round((cant / Math.max(1, incidencias.length)) * 100);
              return (
                <div key={tipo}>
                  <div className="fila" style={{ fontSize: "13px" }}>
                    <strong>{tipo.replace("_", " ").toUpperCase()}</strong>
                    <span className="muted">
                      {cant} ({porcentaje}%)
                    </span>
                  </div>
                  <div className="barra" style={{ marginTop: "4px" }}>
                    <span
                      style={{
                        width: `${porcentaje}%`,
                        background: "var(--warn)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {incidencias.length === 0 && (
              <p className="muted">No hay registros de incidencias para analizar.</p>
            )}
          </div>
        </section>

        {/* Desglose por Turno */}
        <section className="card">
          <h2 className="h3">Incidencias por Turno</h2>
          <div className="lista" style={{ gap: "8px", marginTop: "8px" }}>
            {Object.entries(conteoTurno).map(([t, cant]) => {
              const porcentaje = Math.round((cant / Math.max(1, incidencias.length)) * 100);
              return (
                <div key={t}>
                  <div className="fila" style={{ fontSize: "13px" }}>
                    <strong>TURNO {TURNO[t as keyof typeof TURNO].toUpperCase()}</strong>
                    <span className="muted">
                      {cant} ({porcentaje}%)
                    </span>
                  </div>
                  <div className="barra" style={{ marginTop: "4px" }}>
                    <span
                      style={{
                        width: `${porcentaje}%`,
                        background: "var(--primario)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Ranking de máquinas */}
      <section className="card">
        <h2 className="h3">Máquinas con Mayor Frecuencia de Fallas</h2>
        <table className="tabla" style={{ marginTop: "8px" }}>
          <thead>
            <tr>
              <th>Máquina</th>
              <th>Nombre</th>
              <th>Línea</th>
              <th>Incidencias Reportadas</th>
              <th>Estado Actual</th>
            </tr>
          </thead>
          <tbody>
            {rankingMaquinas.map(([mCod, cant]) => {
              const maq = maquinas.find((m) => m.codigo === mCod);
              return (
                <tr key={mCod}>
                  <td>
                    <strong>{mCod}</strong>
                  </td>
                  <td>{maq?.nombre || mCod}</td>
                  <td>{maq?.linea || "–"}</td>
                  <td>
                    <strong>{cant}</strong> incidencias
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        maq?.estado === "operativa"
                          ? "chip-ok"
                          : maq?.estado === "en_pruebas"
                          ? "chip-warn"
                          : "chip-error"
                      }`}
                    >
                      {maq?.estado?.replace("_", " ") || "desconocido"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rankingMaquinas.length === 0 && (
              <tr>
                <td colSpan={5} className="muted center" style={{ padding: "20px" }}>
                  No se registraron fallas en máquinas hasta el momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
