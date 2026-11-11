import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { EstadoServidor } from "../components/Layout";
import { ROLES, useRol, type Rol } from "../rol";

const USUARIOS_DEMO: Array<{ email: string; pass: string; rol: Rol; label: string }> = [
  { email: "operario@planta.com", pass: "1234", rol: "operario", label: "Operario" },
  { email: "mantenimiento@planta.com", pass: "1234", rol: "mantenimiento", label: "Mantenimiento" },
  { email: "encargado@planta.com", pass: "1234", rol: "encargado", label: "Encargado" },
  { email: "gerencia@planta.com", pass: "1234", rol: "gerencia", label: "Gerencia" },
];

export default function Login() {
  const { login } = useRol();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      console.log("Intentando login con:", { email });
      const res = await api.login(email, password);
      console.log("Login exitoso:", res);
      login({
        nombre: res.nombre,
        email: res.email,
        rol: res.rol,
        token: res.access_token,
      });
      nav(ROLES[res.rol].inicio);
    } catch (err: unknown) {
      console.error("Error en login:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al conectar con el servidor de autenticación");
      }
    } finally {
      setCargando(false);
    }
  };

  const usarCredencialDemo = (demo: typeof USUARIOS_DEMO[number]) => {
    setEmail(demo.email);
    setPassword(demo.pass);
    setError(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">PS</div>
        <div className="topbar-text">
          <strong>PharmaStock Planta</strong>
          <small>Sistema de Stock y Mantenimiento</small>
        </div>
        <EstadoServidor />
      </header>

      <main className="contenido" style={{ maxWidth: "420px", margin: "2rem auto" }}>
        <h1 className="h1">Iniciar Sesión</h1>
        <p className="muted">Ingresá tus credenciales para acceder a tu panel de trabajo.</p>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              borderRadius: "6px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #f87171",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}>
              Correo electrónico:
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="ejemplo@planta.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cargando}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ display: "block", marginBottom: "0.25rem", fontWeight: "bold" }}>
              Contraseña:
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={cargando}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: "0.75rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: cargando ? "not-allowed" : "pointer",
            }}
          >
            {cargando ? "Iniciando..." : "Ingresar"}
          </button>
        </form>

        <section style={{ marginTop: "2rem" }}>
          <small className="muted" style={{ display: "block", marginBottom: "0.5rem", textAlign: "center" }}>
            Credenciales de prueba (clic para autocompletar):
          </small>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {USUARIOS_DEMO.map((demo) => (
              <button
                key={demo.rol}
                type="button"
                onClick={() => usarCredencialDemo(demo)}
                style={{
                  padding: "0.4rem 0.6rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                }}
              >
                {demo.label}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
