import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { HEALTH_URL } from "../api/client";
import { ROLES, useRol } from "../rol";

/** Píldora ONLINE/OFFLINE: consulta el /health REAL del backend cada 15 s (walking skeleton). */
export function EstadoServidor() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const chequear = () =>
      fetch(HEALTH_URL)
        .then((r) => setOnline(r.ok))
        .catch(() => setOnline(false));
    chequear();
    const t = setInterval(chequear, 15000);
    return () => clearInterval(t);
  }, []);
  const clase = online === null ? "" : online ? "ok" : "off";
  return (
    <span className={`pill-estado ${clase}`} title={`GET ${HEALTH_URL}`}>
      <span className="dot" /> {online === null ? "…" : online ? "ONLINE" : "OFFLINE"}
    </span>
  );
}

type Props = { titulo?: string; subtitulo?: string; volver?: string; children: ReactNode; pie?: ReactNode; ancho?: boolean };

/** Estructura común: encabezado + contenido + barra inferior (o pie con botón de acción). */
export default function Layout({ titulo, subtitulo, volver, children, pie, ancho }: Props) {
  const { rol } = useRol();
  const nav = useNavigate();
  const info = rol ? ROLES[rol] : null;

  return (
    <div className={`app ${ancho ? "app-ancho" : ""}`}>
      <header className="topbar">
        {volver ? (
          <button className="icon-btn" onClick={() => nav(volver)} aria-label="Volver">←</button>
        ) : (
          <div className="logo">PS</div>
        )}
        <div className="topbar-text">
          <strong>{titulo ?? info?.titulo}</strong>
          <small>{subtitulo ?? info?.subtitulo}</small>
        </div>
        <EstadoServidor />
      </header>

      <main className="contenido">{children}</main>

      {pie ? (
        <footer className="pie-accion">{pie}</footer>
      ) : (
        info && (
          <nav className="bottom-nav">
            <NavLink to={info.inicio} end>▦<span>Inicio</span></NavLink>
            <NavLink to="/repuestos">▣<span>Repuestos</span></NavLink>
            <Link to="/">◉<span>Cambiar rol</span></Link>
          </nav>
        )
      )}
    </div>
  );
}

export function Estado({ cargando, error }: { cargando: boolean; error: string | null }) {
  if (cargando) return <p className="muted">Cargando…</p>;
  if (error) return <p className="aviso aviso-error">No se pudo cargar: {error}. ¿Está levantado el mock (puerto 4010)?</p>;
  return null;
}
