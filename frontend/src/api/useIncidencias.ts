import { useMemo } from "react";
import { useApi } from "./useApi";
import type { Incidencia } from "./tipos";

export const CLAVE_INCIDENCIAS_LOCALES = "incidencias_creadas_local";
export const CLAVE_ESTADO_OVERRIDES = "incidencias_estado_override";
export const CLAVE_INCIDENCIAS_ELIMINADAS = "incidencias_eliminadas_local";

/**
 * Devuelve todas las incidencias (del mock + creadas localmente),
 * aplicando eliminaciones y overrides de estado.
 */
export function useIncidencias() {
  const { data, cargando, error, recargar } = useApi<Incidencia[]>("/incidencias");

  const todas = useMemo(() => {
    const creadas: Incidencia[] = JSON.parse(localStorage.getItem(CLAVE_INCIDENCIAS_LOCALES) ?? "[]");
    const eliminadas: number[] = JSON.parse(localStorage.getItem(CLAVE_INCIDENCIAS_ELIMINADAS) ?? "[]");
    const overrides: Record<string, string> = JSON.parse(localStorage.getItem(CLAVE_ESTADO_OVERRIDES) ?? "{}");

    // Combinar mock + creadas localmente (evitando duplicados de id)
    const base = [...creadas, ...(data ?? [])];
    const sinDuplicados: Incidencia[] = [];
    const idsVistos = new Set<number>();

    for (const item of base) {
      if (!idsVistos.has(item.id)) {
        idsVistos.add(item.id);
        sinDuplicados.push(item);
      }
    }

    return sinDuplicados
      .filter((inc) => !eliminadas.includes(inc.id))
      .map((inc) => {
        const override = overrides[String(inc.id)];
        return override ? { ...inc, estado: override as Incidencia["estado"] } : inc;
      });
  }, [data]);

  return { incidencias: todas, cargando, error, recargar };
}
