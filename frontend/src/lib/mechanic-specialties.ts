import type { Mechanic, ServiceOrderType } from "@/types";

// Catálogo único de especialidades — usado por el dropdown de "Especialidad" en Usuarios
// y por el filtro de mecánicos disponibles al asignar una orden (ver mechanicsForOrderType).
export const SPECIALTY_OPTIONS = [
  "Motor y transmision",
  "Motor diesel",
  "Electricidad",
  "Inyeccion electronica",
  "Frenos y suspension",
  "Aire acondicionado",
  "Chapa y pintura",
  "Alineacion y balanceo",
  "Sistemas de escape",
  "Neumaticos y gomeria",
  "Lubricentro",
  "General + Lubricentro",
  "Gral. multimarca",
];

// Especialidades habilitadas para tomar órdenes de tipo Lubricentro (cambio de aceite).
const LUBRICENTRO_SPECIALTIES = new Set(["Lubricentro", "General + Lubricentro"]);

/** Filtra los mecánicos que pueden tomar una orden del tipo dado: los de Lubricentro puro
 *  solo aparecen en órdenes de cambio de aceite; el resto (incluyendo "General + Lubricentro")
 *  aparece en reparación general. */
export function mechanicsForOrderType(mechanics: Mechanic[], type: ServiceOrderType): Mechanic[] {
  if (type === "Lubricentro") {
    return mechanics.filter((m) => LUBRICENTRO_SPECIALTIES.has(m.specialty ?? ""));
  }
  return mechanics.filter((m) => m.specialty !== "Lubricentro");
}
