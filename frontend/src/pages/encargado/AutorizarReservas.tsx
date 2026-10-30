import { useState } from "react";
import Layout, { Estado } from "../../components/Layout";
import { api, ApiError } from "../../api/client";
import { haceCuanto, useApi } from "../../api/useApi";
import type { Repuesto, Reserva } from "../../api/tipos";

export default function AutorizarReservas() {
  const { data, cargando, error } = useApi<Reserva[]>("/reservas?estado=activa");
  const repuestos = useApi<Repuesto[]>("/repuestos");
  const [autorizadas, setAutorizadas] = useState<number[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const pendientes = (data ?? []).filter((r) => !autorizadas.includes(r.id));
  const urgentes = pendientes.filter((r) => r.urgencia === "urgente").length;

  /** RN-05: solo el Encargado puede liberar una reserva. */
  async function autorizar(r: Reserva) {
    setMensaje(null);
    try {
      await api.post<Reserva>(`/reservas/${r.id}/liberacion`, {
        motivo: r.incidenciaId ? `Uso autorizado para la incidencia #${r.incidenciaId}` : "Uso autorizado por el encargado",
      });
      setAutorizadas([...autorizadas, r.id]);
      setMensaje(`Reserva #RES-${r.id} liberada.`);
    } catch (e) {
      setMensaje(e instanceof ApiError ? `${e.codigo}: ${e.message}` : (e as Error).message);
    }
  }

  return (
    <Layout titulo="Autorización de Reservas" subtitulo="Supervisión y control" volver="/encargado">
      <div className="grid-2">
        <div className="card card-error"><small className="etiqueta">Pendientes</small><span className="kpi">{pendientes.length}</span><small>{urgentes} urgentes</small></div>
        <div className="card"><small className="etiqueta">Liberadas ahora</small><span className="kpi">{autorizadas.length}</span></div>
      </div>
      {mensaje && <p className="aviso">{mensaje}</p>}
      <Estado cargando={cargando} error={error} />

      <div className="lista">
        {pendientes.map((r) => (
          <div key={r.id} className={`card borde-${r.urgencia === "urgente" ? "error" : "neutro"}`}>
            <div className="fila">
              <span className={`chip ${r.urgencia === "urgente" ? "chip-error" : ""}`}>#RES-{r.id} · {r.urgencia === "urgente" ? "URGENTE" : "PREVENTIVO"}</span>
              {r.creadaEn && <small className="muted">🕑 {haceCuanto(r.creadaEn)}</small>}
            </div>
            <div className="card card-interna">
              <strong>{r.motivo}</strong>
              <small className="muted">
                {r.incidenciaId ? `Vínculo: #INC-${r.incidenciaId} · ` : ""}{r.solicitadaPor ? `Téc. ${r.solicitadaPor}` : ""}
              </small>
            </div>
            {r.lineas.map((l) => {
              const rep = repuestos.data?.find((x) => x.codigo === l.repuestoCodigo);
              const queda = rep ? rep.stockFisico - l.cantidad : null;
              return (
                <div key={l.repuestoCodigo}>
                  <div className="fila">
                    <strong>{l.repuestoCodigo}{rep ? ` · ${rep.nombre}` : ""}</strong>
                    <span className="kpi-chico">{l.cantidad} ud</span>
                  </div>
                  {rep && queda !== null && queda <= rep.umbralMinimo && (
                    <p className="aviso aviso-warn">⚠ Autorizar dejará {queda} ud (umbral mínimo {rep.umbralMinimo}).</p>
                  )}
                </div>
              );
            })}
            <button className="btn btn-primario" onClick={() => autorizar(r)}>✓ Autorizar uso</button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
