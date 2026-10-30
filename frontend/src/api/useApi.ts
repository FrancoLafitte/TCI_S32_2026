import { useEffect, useState } from "react";
import { api } from "./client";

/** Hook simple para hacer un GET al montar el componente. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    api
      .get<T>(path)
      .then((d) => !cancelado && setData(d))
      .catch((e: Error) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setCargando(false));
    return () => { cancelado = true; };
  }, [path]);

  return { data, error, cargando };
}

/** "hace 42 min", "hace 2 h"... */
export function haceCuanto(fechaIso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
