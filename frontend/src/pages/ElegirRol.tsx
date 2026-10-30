import { useNavigate } from "react-router-dom";
import { EstadoServidor } from "../components/Layout";
import { ROLES, useRol, type Rol } from "../rol";

export default function ElegirRol() {
  const { setRol } = useRol();
  const nav = useNavigate();

  const entrar = (r: Rol) => {
    setRol(r);
    nav(ROLES[r].inicio);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">PS</div>
        <div className="topbar-text">
          <strong>PharmaStock Planta</strong>
          <small>Stock y mantenimiento</small>
        </div>
        <EstadoServidor />
      </header>
      <main className="contenido">
        <h1 className="h1">¿Con qué rol entrás?</h1>
        <p className="muted">Login simulado (M3). La autenticación real llega en M5.</p>
        <div className="lista">
          {(Object.keys(ROLES) as Rol[]).map((r) => (
            <button key={r} className="card card-link" onClick={() => entrar(r)}>
              <div>
                <strong>{ROLES[r].titulo}</strong>
                <small className="muted">{ROLES[r].subtitulo}</small>
              </div>
              <span>→</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
