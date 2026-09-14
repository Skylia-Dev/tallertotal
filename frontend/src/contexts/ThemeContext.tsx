"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  ACCENTS, DEFAULT_ACCENT_ID, COLOR_MODE_STORAGE_KEY, ACCENT_STORAGE_KEY, type ColorMode,
} from "@/lib/theme";

interface ThemeContextValue {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  accentId: string;
  setAccentId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => {},
  accentId: DEFAULT_ACCENT_ID,
  setAccentId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("light");
  const [accentId, setAccentIdState] = useState(DEFAULT_ACCENT_ID);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (savedMode === "light" || savedMode === "dark") {
        setModeState(savedMode);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setModeState("dark");
      }

      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (savedAccent && ACCENTS.some((a) => a.id === savedAccent)) {
        setAccentIdState(savedAccent);
      }
    } catch {
      // localStorage unavailable — keep defaults
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    const classList = document.documentElement.classList;
    ACCENTS.forEach((a) => classList.remove(`accent-${a.id}`));
    if (accentId !== DEFAULT_ACCENT_ID) {
      classList.add(`accent-${accentId}`);
    }
  }, [accentId]);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    try { localStorage.setItem(COLOR_MODE_STORAGE_KEY, next); } catch {}
  }, []);

  const setAccentId = useCallback((id: string) => {
    setAccentIdState(id);
    try { localStorage.setItem(ACCENT_STORAGE_KEY, id); } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, accentId, setAccentId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeSettings = () => useContext(ThemeContext);
