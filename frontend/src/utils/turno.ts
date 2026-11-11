export type Turno = "mañana" | "tarde" | "noche";

export interface InfoTurno {
  id: Turno;
  etiqueta: string;
  horario: string;
}

export const TURNOS: Record<Turno, InfoTurno> = {
  mañana: {
    id: "mañana",
    etiqueta: "Turno Mañana",
    horario: "06:00 - 14:00",
  },
  tarde: {
    id: "tarde",
    etiqueta: "Turno Tarde",
    horario: "14:00 - 22:00",
  },
  noche: {
    id: "noche",
    etiqueta: "Turno Noche",
    horario: "22:00 - 06:00",
  },
};

/**
 * Calcula el turno actual según la hora local de la máquina:
 * - 06:00 a 13:59: Mañana
 * - 14:00 a 21:59: Tarde
 * - 22:00 a 05:59: Noche
 */
export function obtenerTurnoActual(fecha: Date = new Date()): InfoTurno {
  const hora = fecha.getHours();
  if (hora >= 6 && hora < 14) return TURNOS.mañana;
  if (hora >= 14 && hora < 22) return TURNOS.tarde;
  return TURNOS.noche;
}
