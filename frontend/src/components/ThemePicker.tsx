"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { ACCENTS } from "@/lib/theme";
import { useThemeSettings } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const { mode, setMode, accentId, setAccentId } = useThemeSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Apariencia"
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Palette className="h-4 w-4 shrink-0" />
        Apariencia
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-2 z-50">
          <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">Modo</p>
          <div className="flex gap-1 pb-2">
            <button
              onClick={() => setMode("light")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium border transition-colors",
                mode === "light" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Sun className="w-3.5 h-3.5" /> Claro
            </button>
            <button
              onClick={() => setMode("dark")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium border transition-colors",
                mode === "dark" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Moon className="w-3.5 h-3.5" /> Oscuro
            </button>
          </div>

          <div className="border-t border-border pt-2">
            <p className="px-1 pb-1.5 text-xs font-semibold text-muted-foreground">Color</p>
            <div className="grid grid-cols-4 gap-2 px-1">
              {ACCENTS.map((accent) => {
                const active = accent.id === accentId;
                return (
                  <button
                    key={accent.id}
                    onClick={() => setAccentId(accent.id)}
                    title={accent.name}
                    aria-label={accent.name}
                    className="relative w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-border"
                    style={{ backgroundColor: mode === "dark" ? accent.dark : accent.light }}
                  >
                    {active && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
