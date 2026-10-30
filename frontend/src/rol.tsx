/**
 * "Login" de mentira (stub) para M3: el usuario elige su rol y lo guardamos en
 * localStorage. El token que mandamos es "Bearer mock-<rol>"; Prism acepta cualquiera.
 * En M4/M5 esto se reemplaza por autenticación real.
 */
import { createContext, useContext, useState, type ReactNode } from "react";

export type Rol = "operario" | "mantenimiento" | "encargado" | "gerencia";

export const ROLES: Record<Rol, { titulo: string; subtitulo: string; inicio: string }> = {
  operario: { titulo: "Operario de Planta", subtitulo: "Reporte de incidencias", inicio: "/operario" },
  mantenimiento: { titulo: "Técnico de Mantenimiento", subtitulo: "Mantenimiento & Almacén", inicio: "/mantenimiento" },
  encargado: { titulo: "Encargado de Mantenimiento", subtitulo: "Supervisión, compras & reservas", inicio: "/encargado" },
  gerencia: { titulo: "Gerencia", subtitulo: "Supervisión operativa (solo lectura)", inicio: "/gerencia" },
};

type Ctx = { rol: Rol | null; setRol: (r: Rol | null) => void };
const RolContext = createContext<Ctx>({ rol: null, setRol: () => {} });

export function RolProvider({ children }: { children: ReactNode }) {
  const [rol, setRolState] = useState<Rol | null>(() => localStorage.getItem("rol") as Rol | null);
  const setRol = (r: Rol | null) => {
    if (r) localStorage.setItem("rol", r);
    else localStorage.removeItem("rol");
    setRolState(r);
  };
  return <RolContext.Provider value={{ rol, setRol }}>{children}</RolContext.Provider>;
}

export const useRol = () => useContext(RolContext);
