import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

describe("cliente de la API", () => {
  it("manda el token con el rol elegido", async () => {
    localStorage.setItem("rol", "encargado");
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("[]", { status: 200 }));
    await api.get("/reservas");
    const headers = spy.mock.calls[0][1]!.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer mock-encargado");
  });

  it("convierte un 409 del contrato en ApiError con su código (RN-01)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ codigo: "STOCK_INSUFICIENTE", mensaje: "No alcanza" }), { status: 409 }),
    );
    await expect(api.post("/reparaciones/1/lineas-uso", {})).rejects.toMatchObject({
      status: 409,
      codigo: "STOCK_INSUFICIENTE",
    } satisfies Partial<ApiError>);
  });

  it("envía el token de Turnstile y detecta cuándo auth exige CAPTCHA", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: {
            detail: "Completa la verificación CAPTCHA para continuar",
            captcha_required: true,
          },
        }),
        { status: 428 },
      ),
    );

    await expect(api.login("operario@planta.com", "1234", "turnstile-token")).rejects.toMatchObject({
      status: 428,
      captchaRequired: true,
    } satisfies Partial<ApiError>);
    expect(JSON.parse(spy.mock.calls[0][1]!.body as string)).toMatchObject({
      email: "operario@planta.com",
      password: "1234",
      captcha_token: "turnstile-token",
    });
  });
});
