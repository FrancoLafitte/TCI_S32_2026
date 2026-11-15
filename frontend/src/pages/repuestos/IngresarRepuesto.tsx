import { useState, useMemo } from "react";
import Layout, { Estado } from "../../components/Layout";
import { api } from "../../api/client";
import { useApi } from "../../api/useApi";
import type { Repuesto } from "../../api/tipos";

export default function IngresarRepuesto() {
  const catalogo = useApi<Repuesto[]>("/repuestos");

  const [codigoSeleccionado, setCodigoSeleccionado] = useState("");
  const [lote, setLote] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [ubicacionCodigo, setUbicacionCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{
    codigo: string;
    nombre: string;
    lote?: string;
    cantidadIngresada: number;
    stockFisico: number;
  } | null>(null);

  // Repuesto activo según la selección
  const repuesto = useMemo(
    () => catalogo.data?.find((r) => r.codigo === codigoSeleccionado) ?? null,
    [catalogo.data, codigoSeleccionado]
  );

  // Ubicaciones físicas disponibles obtenidas del catálogo
  const ubicacionesDisponibles = useMemo(() => {
    if (!catalogo.data) return [];
    const mapa = new Map<string, string>();
    for (const r of catalogo.data) {
      if (r.ubicacion?.codigo) {
        mapa.set(r.ubicacion.codigo, r.ubicacion.descripcion ?? r.ubicacion.codigo);
      }
    }
    return Array.from(mapa.entries()).map(([codigo, desc]) => ({ codigo, desc }));
  }, [catalogo.data]);

  // Al seleccionar un repuesto, autocompletar ubicación sugerida
  function manejarCambioRepuesto(nuevoCodigo: string) {
    setCodigoSeleccionado(nuevoCodigo);
    setOk(null);
    setError(null);
    const r = catalogo.data?.find((x) => x.codigo === nuevoCodigo);
    if (r?.ubicacion?.codigo) {
      setUbicacionCodigo(r.ubicacion.codigo);
    }
  }

  async function confirmar() {
    if (!repuesto) {
      setError("Debes seleccionar un repuesto existente.");
      return;
    }
    if (!ubicacionCodigo) {
      setError("Debes seleccionar una ubicación física de almacenamiento.");
      return;
    }
    setEnviando(true);
    setError(null);

    try {
      // Registro de ingreso al stock físico (RN-08) y creación de MovimientoStock inmutable
      await api.post(`/repuestos/${repuesto.codigo}/ingresos`, {
        cantidad,
        lote: lote.trim() || undefined,
        ubicacion: { codigo: ubicacionCodigo },
      });

      setOk({
        codigo: repuesto.codigo,
        nombre: repuesto.nombre,
        lote: lote.trim() || undefined,
        cantidadIngresada: cantidad,
        stockFisico: repuesto.stockFisico + cantidad,
      });

      // Resetear para un próximo ingreso
      setCodigoSeleccionado("");
      setLote("");
      setCantidad(1);
      catalogo.recargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Layout
      titulo="Ingresar Repuesto"
      subtitulo="Recepción y alta de stock en almacén"
      volver="/repuestos"
      pie={
        <button
          className="btn btn-primario btn-grande"
          disabled={enviando || !repuesto || !ubicacionCodigo}
          onClick={confirmar}
        >
          {enviando ? "Registrando ingreso…" : "▣ Confirmar ingreso al stock"}
        </button>
      }
    >
      <Estado cargando={catalogo.cargando} error={catalogo.error} />

      {ok && (
        <div className="aviso aviso-ok">
          Se ingresaron +{ok.cantidadIngresada} unidad(es) de <strong>{ok.nombre} ({ok.codigo})</strong>.
          {ok.lote && <><br />Lote de fabricación registrado: <strong>{ok.lote}</strong>.</>}
          <br />Nuevo stock físico disponible: {ok.stockFisico} unidades (RN-08).
        </div>
      )}

      {/* 1. Selección del repuesto existente */}
      <section className="card">
        <h3 className="h3"><span className="num">1</span> Repuesto recibido</h3>
        <label className="etiqueta">Seleccionar del catálogo</label>
        <select
          className="input"
          value={codigoSeleccionado}
          onChange={(e) => manejarCambioRepuesto(e.target.value)}
        >
          <option value="">Elegir repuesto…</option>
          {catalogo.data?.map((r) => (
            <option key={r.codigo} value={r.codigo}>
              {r.codigo} · {r.nombre} (Stock actual: {r.stockDisponible} uds)
            </option>
          ))}
        </select>

        {repuesto && (
          <div className="card card-interna borde-ok" style={{ marginTop: "0.5rem" }}>
            <div className="fila" style={{ justifyContent: "space-between" }}>
              <span className="chip chip-codigo">{repuesto.codigo}</span>
              <span className="chip chip-ok">En catálogo</span>
            </div>
            <strong>{repuesto.nombre}</strong>
            {repuesto.descripcion && <small className="muted">{repuesto.descripcion}</small>}
            <div className="fila" style={{ marginTop: "0.4rem" }}>
              <small className="muted">Stock disponible: <strong>{repuesto.stockDisponible} uds</strong></small>
              <small className="muted">Umbral mínimo: <strong>{repuesto.umbralMinimo} uds</strong></small>
            </div>
            {repuesto.maquinasCompatibles && repuesto.maquinasCompatibles.length > 0 && (
              <small className="muted">Compatible con máquinas: {repuesto.maquinasCompatibles.join(", ")}</small>
            )}
          </div>
        )}
      </section>

      {/* 2. Lote del fabricante */}
      <section className="card">
        <h3 className="h3"><span className="num">2</span> Trazabilidad / Lote</h3>
        <label className="etiqueta">Número de lote del fabricante (opcional)</label>
        <input
          className="input"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
          placeholder="Ej: L-2026-V98"
        />
        <small className="muted">
          Permite registrar la trazabilidad farmacéutica del lote recibido (RN-06).
        </small>
      </section>

      {/* 3. Cantidad física */}
      <section className="card">
        <h3 className="h3"><span className="num">3</span> Cantidad física recibida</h3>
        <div className="stepper">
          <button className="btn" type="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))}>−</button>
          <span className="kpi">{cantidad}<small> uds</small></span>
          <button className="btn btn-primario" type="button" onClick={() => setCantidad(cantidad + 1)}>+</button>
        </div>
      </section>

      {/* 4. Ubicación en almacén */}
      <section className="card">
        <h3 className="h3"><span className="num">4</span> Ubicación en almacén</h3>
        <label className="etiqueta">Ubicación de almacenamiento</label>
        <select
          className="input"
          value={ubicacionCodigo}
          onChange={(e) => setUbicacionCodigo(e.target.value)}
        >
          <option value="">Seleccionar estante / depósito…</option>
          {ubicacionesDisponibles.map((u) => (
            <option key={u.codigo} value={u.codigo}>
              {u.codigo} · {u.desc}
            </option>
          ))}
        </select>
        {repuesto?.ubicacion?.codigo && ubicacionCodigo === repuesto.ubicacion.codigo && (
          <span className="chip chip-ok" style={{ marginTop: "0.4rem" }}>
            Ubicación habitual sugerida para este repuesto
          </span>
        )}
      </section>

      {error && <p className="aviso aviso-error">{error}</p>}
    </Layout>
  );
}
