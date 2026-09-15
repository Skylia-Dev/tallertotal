import type { ServiceOrderType } from "@/types";

// Debe coincidir exactamente (mismo texto) con backend/TallerTotal.Api/Services/ChecklistTemplates.cs
export const CHECKLIST_TEMPLATES: Record<ServiceOrderType, string[]> = {
  General: [
    "Nivel de aceite", "Líquido refrigerante", "Frenos", "Neumáticos", "Luces",
    "Batería", "Correas", "Filtro de aire", "Limpiaparabrisas", "Suspensión",
    "Escape", "Carrocería", "Fugas visibles",
  ],
  Lubricentro: [
    "Nivel de aceite motor", "Filtro de aceite", "Filtro de aire", "Filtro de habitáculo",
    "Presión de neumáticos", "Líquido de frenos", "Líquido refrigerante",
    "Estado de correas", "Batería", "Luces", "Escobillas limpiaparabrisas",
  ],
};
