export type ColorMode = "light" | "dark" | "tenue";

export interface Accent {
  id: string;
  name: string;
  /** Hex used for the primary accent in light mode (also used for the swatch preview). */
  light: string;
  /** Hex used for the primary accent in dark mode. */
  dark: string;
  /** Hex used for the primary accent in "tenue" (intermediate) mode. */
  tenue: string;
}

export const ACCENTS: Accent[] = [
  { id: "azul", name: "Azul", light: "#2563eb", dark: "#60a5fa", tenue: "#4a85d9" },
  { id: "naranja", name: "Naranja", light: "#d1531f", dark: "#e17a44", tenue: "#dd6530" },
  { id: "verde", name: "Verde", light: "#1a7a4c", dark: "#52c98a", tenue: "#35a16b" },
  { id: "violeta", name: "Violeta", light: "#6d28d9", dark: "#b298f0", tenue: "#8f5fe0" },
  { id: "rosa", name: "Rosa", light: "#be1257", dark: "#f793b8", tenue: "#dd5486" },
  { id: "turquesa", name: "Turquesa", light: "#0f766e", dark: "#2dd4bf", tenue: "#1c9c8f" },
  { id: "amarillo", name: "Amarillo", light: "#a16207", dark: "#facc15", tenue: "#d99a1a" },
  { id: "rojo", name: "Rojo", light: "#dc2626", dark: "#f87171", tenue: "#e8514f" },
];

export const DEFAULT_ACCENT_ID = "azul";
export const COLOR_MODE_STORAGE_KEY = "tallertotal-color-mode";
export const ACCENT_STORAGE_KEY = "tallertotal-accent";
