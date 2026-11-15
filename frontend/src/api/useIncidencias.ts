import { useApi } from "./useApi";
import type { Incidencia } from "./tipos";

/**
 * Devuelve todas las incidencias consultadas directamente del backend.
 */
export function useIncidencias() {
  const { data, cargando, error, recargar } = useApi<Incidencia[]>("/incidencias");
  return { incidencias: data ?? [], cargando, error, recargar };
}
