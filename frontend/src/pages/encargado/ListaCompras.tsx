import { useEffect, useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { api } from "../../api/client";
import { useApi } from "../../api/useApi";
import type { ItemListaCompras, PedidoCompra } from "../../api/tipos";

type Fila = ItemListaCompras & { cantidad: number; elegido: boolean };

export default function ListaCompras() {
  const { data, cargando, error } = useApi<ItemListaCompras[]>("/lista-compras");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [pedido, setPedido] = useState<PedidoCompra | null>(null);
  const [errEnvio, setErrEnvio] = useState<string | null>(null);

  useEffect(() => {
    if (data) setFilas(data.map((i) => ({ ...i, cantidad: i.cantidadSugerida ?? 1, elegido: true })));
  }, [data]);

  const elegidas = filas.filter((f) => f.elegido);
  const total = elegidas.reduce((s, f) => s + (f.precioUnitario ?? 0) * f.cantidad, 0);
  const hayUrgente = elegidas.some((f) => f.urgencia === "urgente");

  const actualizar = (codigo: string, cambios: Partial<Fila>) =>
    setFilas(filas.map((f) => (f.repuestoCodigo === codigo ? { ...f, ...cambios } : f)));

  /** RN-03 / RN-04: el pedido se envía con grado de urgencia. */
  async function generar() {
    setErrEnvio(null);
    try {
      const p = await api.post<PedidoCompra>("/pedidos-compra", {
        urgencia: hayUrgente ? "urgente" : "normal",
        lineas: elegidas.map((f) => ({ repuestoCodigo: f.repuestoCodigo, cantidad: f.cantidad })),
      });
      setPedido(p);
    } catch (e) {
      setErrEnvio((e as Error).message);
    }
  }

  return (
    <Layout
      titulo="Lista de Compras & Reposición"
      subtitulo="Supervisión y control"
      volver="/encargado"
      pie={
        <div className="pie-total">
          <div className="fila"><small>{elegidas.length} artículos seleccionados</small><strong>${total.toLocaleString("es-AR")} USD</strong></div>
          <button className="btn btn-primario btn-grande" disabled={!elegidas.length} onClick={generar}>Generar orden de compra</button>
        </div>
      }
    >
      {pedido && <div className="aviso aviso-ok">Pedido #OC-{pedido.id} generado ({pedido.urgencia}). Se notificó a encargados y gerencia (RN-09).</div>}
      {errEnvio && <p className="aviso aviso-error">{errEnvio}</p>}
      <div className="aviso aviso-error"><strong>Punto de pedido activado</strong><br />{filas.length} referencias bajo stock de seguridad.</div>
      <Estado cargando={cargando} error={error} />

      <div className="lista">
        {filas.map((f) => (
          <div key={f.repuestoCodigo} className={`card borde-${f.urgencia === "urgente" ? "error" : "ok"}`}>
            <div className="fila">
              <label className="fila">
                <input type="checkbox" checked={f.elegido} onChange={(e) => actualizar(f.repuestoCodigo, { elegido: e.target.checked })} />
                <span className="chip chip-codigo">{f.repuestoCodigo}</span>
                <span className={`chip ${f.urgencia === "urgente" ? "chip-error" : "chip-ok"}`}>{f.urgencia === "urgente" ? "Quiebre inminente" : "Preventivo"}</span>
              </label>
              <strong>${((f.precioUnitario ?? 0) * f.cantidad).toLocaleString("es-AR")}</strong>
            </div>
            <strong>{f.nombre}</strong>
            {f.motivo && <small className="muted">{f.motivo}</small>}
            <div className="fila">
              <small className="texto-error">Stock: {f.stockDisponible ?? "–"} uds / Mín: {f.umbralMinimo ?? "–"}</small>
              <div className="stepper">
                <button className="btn" onClick={() => actualizar(f.repuestoCodigo, { cantidad: Math.max(1, f.cantidad - 1) })}>−</button>
                <span>{f.cantidad}</span>
                <button className="btn" onClick={() => actualizar(f.repuestoCodigo, { cantidad: f.cantidad + 1 })}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
