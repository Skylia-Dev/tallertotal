export type ColorMode = "light" | "dark";

export interface Accent {
  id: string;
  name: string;
  /** Hex used for the primary accent in light mode (also used for the swatch preview). */
  light: string;
  /** Hex used for the primary accent in dark mode. */
  dark: string;
}

export const ACCENTS: Accent[] = [
  { id: "azul", name: "Azul", light: "#2563eb", dark: "#60a5fa" },
  { id: "naranja", name: "Naranja", light: "#d1531f", dark: "#e17a44" },
  { id: "verde", name: "Verde", light: "#1a7a4c", dark: "#52c98a" },
  { id: "violeta", name: "Violeta", light: "#6d28d9", dark: "#b298f0" },
  { id: "rosa", name: "Rosa", light: "#be1257", dark: "#f793b8" },
  { id: "turquesa", name: "Turquesa", light: "#0f766e", dark: "#2dd4bf" },
  { id: "amarillo", name: "Amarillo", light: "#a16207", dark: "#facc15" },
  { id: "rojo", name: "Rojo", light: "#dc2626", dark: "#f87171" },
];

export const DEFAULT_ACCENT_ID = "azul";
export const COLOR_MODE_STORAGE_KEY = "tallertotal-color-mode";
export const ACCENT_STORAGE_KEY = "tallertotal-accent";
