/**
 * Cliente HTTP único de la app. TODAS las llamadas a la API pasan por acá.
 * - En M3 apunta al mock de Prism (VITE_API_URL, por defecto http://localhost:4010).
 * - En M4 solo hay que cambiar VITE_API_URL al backend real: el contrato es el mismo.
 */
import type { ErrorApi } from "./tipos";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4010";
export const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? (typeof window !== "undefined" && window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8000" : "http://localhost:8000");
export const HEALTH_URL = import.meta.env.VITE_HEALTH_URL ?? (typeof window !== "undefined" && window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:8000/health" : "http://localhost:8000/health");

export class ApiError extends Error {
  constructor(public status: number, public codigo: string, mensaje: string) {
    super(mensaje);
  }
}

function token(): string {
  const t = localStorage.getItem("token");
  if (t) return `Bearer ${t}`;
  return `Bearer mock-${localStorage.getItem("rol") ?? "anonimo"}`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Authorization: token() };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // el navegador pone el Content-Type multipart solo
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    let err: Partial<ErrorApi> = {};
    try { err = await res.json(); } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, err.codigo ?? `HTTP_${res.status}`, err.mensaje ?? res.statusText);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  login: async (email: string, password: string) => {
    const res = await fetch(`${AUTH_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let detalle = "Error al iniciar sesión";
      try {
        const body = await res.json();
        detalle = body.detail ?? detalle;
      } catch {
        /* no es json */
      }
      throw new ApiError(res.status, `HTTP_${res.status}`, detalle);
    }
    return (await res.json()) as {
      access_token: string;
      token_type: string;
      rol: "operario" | "mantenimiento" | "encargado" | "gerencia";
      nombre: string;
      email: string;
    };
  },
};
