import { createContext, useContext, useState, type ReactNode } from "react";

export type Rol = "operario" | "mantenimiento" | "encargado" | "gerencia";

export interface UsuarioSesion {
  nombre: string;
  email: string;
  rol: Rol;
  token: string;
}

export const ROLES: Record<Rol, { titulo: string; subtitulo: string; inicio: string }> = {
  operario: { titulo: "Operario de Planta", subtitulo: "Reporte de incidencias", inicio: "/operario" },
  mantenimiento: { titulo: "Técnico de Mantenimiento", subtitulo: "Mantenimiento & Almacén", inicio: "/mantenimiento" },
  encargado: { titulo: "Encargado de Mantenimiento", subtitulo: "Supervisión, compras & reservas", inicio: "/encargado" },
  gerencia: { titulo: "Gerencia", subtitulo: "Supervisión operativa (solo lectura)", inicio: "/gerencia" },
};

type Ctx = {
  rol: Rol | null;
  usuario: UsuarioSesion | null;
  login: (datos: UsuarioSesion) => void;
  setRol: (r: Rol | null) => void;
  logout: () => void;
};

const RolContext = createContext<Ctx>({
  rol: null,
  usuario: null,
  login: () => {},
  setRol: () => {},
  logout: () => {},
});

export function RolProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    const r = localStorage.getItem("rol") as Rol | null;
    return r ? { rol: r, nombre: ROLES[r]?.titulo ?? r, email: `${r}@planta.com`, token: `mock-${r}` } : null;
  });

  const rol = usuario?.rol ?? null;

  const login = (datos: UsuarioSesion) => {
    localStorage.setItem("usuario", JSON.stringify(datos));
    localStorage.setItem("rol", datos.rol);
    localStorage.setItem("token", datos.token);
    setUsuario(datos);
  };

  const setRol = (r: Rol | null) => {
    if (r) {
      login({
        rol: r,
        nombre: ROLES[r].titulo,
        email: `${r}@planta.com`,
        token: `mock-${r}`,
      });
    } else {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("token");
    setUsuario(null);
  };

  return (
    <RolContext.Provider value={{ rol, usuario, login, setRol, logout }}>
      {children}
    </RolContext.Provider>
  );
}

export const useRol = () => useContext(RolContext);
