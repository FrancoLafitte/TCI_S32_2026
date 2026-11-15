import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import type { Maquina, MaquinaCreate, MaquinaUpdate } from "../api/tipos";

afterEach(() => vi.restoreAllMocks());

describe("Gestión de Maquinaria - API Client", () => {
  it("obtiene la lista de máquinas registradas", async () => {
    const mockMaquinas: Maquina[] = [
      {
        codigo: "MAQ-F04",
        nombre: "Fraccionador F-04",
        tipo: "Fraccionador",
        ejemplar: "F-04",
        linea: "Línea 2",
        estado: "operativa",
        repuestosAMantener: ["REP-7742"],
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockMaquinas), { status: 200 })
    );

    const maquinas = await api.get<Maquina[]>("/maquinas");
    expect(maquinas).toHaveLength(1);
    expect(maquinas[0].codigo).toBe("MAQ-F04");
    expect(maquinas[0].repuestosAMantener).toContain("REP-7742");
  });

  it("registra una nueva máquina con repuestos asociados (RN-07)", async () => {
    const payload: MaquinaCreate = {
      codigo: "MAQ-CA03",
      nombre: "Caldera CA-03",
      tipo: "Caldera",
      ejemplar: "CA-03",
      linea: "Sala Térmica",
      estado: "operativa",
      repuestosAMantener: ["REP-7742", "REP-1024"],
    };

    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ...payload, repuestosAMantener: payload.repuestosAMantener }), {
        status: 201,
      })
    );

    const res = await api.post<Maquina>("/maquinas", payload);
    expect(res.codigo).toBe("MAQ-CA03");
    expect(res.repuestosAMantener).toHaveLength(2);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/maquinas"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("actualiza el estado operativo de una máquina", async () => {
    const update: MaquinaUpdate = { estado: "en_mantenimiento" };

    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          codigo: "MAQ-F04",
          tipo: "Fraccionador",
          ejemplar: "F-04",
          estado: "en_mantenimiento",
          repuestosAMantener: [],
        }),
        { status: 200 }
      )
    );

    const res = await api.patch<Maquina>("/maquinas/MAQ-F04", update);
    expect(res.estado).toBe("en_mantenimiento");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/maquinas/MAQ-F04"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(update),
      })
    );
  });

  it("vincula un nuevo repuesto a la máquina", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          codigo: "MAQ-F04",
          tipo: "Fraccionador",
          ejemplar: "F-04",
          estado: "operativa",
          repuestosAMantener: ["REP-7742", "REP-9900"],
        }),
        { status: 200 }
      )
    );

    const res = await api.post<Maquina>("/maquinas/MAQ-F04/repuestos", {
      repuestoCodigo: "REP-9900",
    });

    expect(res.repuestosAMantener).toContain("REP-9900");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/maquinas/MAQ-F04/repuestos"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
