"use client";

import type { LubricentroDetails } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FILTER_OPTIONS: { key: keyof Pick<LubricentroDetails, "changedOilFilter" | "changedAirFilter" | "changedCabinFilter" | "changedFuelFilter">; label: string }[] = [
  { key: "changedOilFilter", label: "Filtro de aceite" },
  { key: "changedAirFilter", label: "Filtro de aire" },
  { key: "changedCabinFilter", label: "Filtro de habitáculo" },
  { key: "changedFuelFilter", label: "Filtro de combustible" },
];

export function LubricentroFields({ value, onChange }: { value: LubricentroDetails; onChange: (next: LubricentroDetails) => void }) {
  const set = <K extends keyof LubricentroDetails>(key: K, v: LubricentroDetails[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Datos del cambio de aceite</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Marca de aceite</Label>
          <Input
            value={value.oilBrand ?? ""}
            onChange={(e) => set("oilBrand", e.target.value || undefined)}
            placeholder="Ej: YPF, Shell"
          />
        </div>
        <div className="space-y-1">
          <Label>Tipo / viscosidad</Label>
          <Input
            value={value.oilType ?? ""}
            onChange={(e) => set("oilType", e.target.value || undefined)}
            placeholder="Ej: 10W40"
          />
        </div>
        <div className="space-y-1">
          <Label>Litros</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={value.oilLiters ?? ""}
            onChange={(e) => set("oilLiters", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 4"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Filtros cambiados</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FILTER_OPTIONS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={value[f.key]}
                onChange={(e) => set(f.key, e.target.checked)}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Próximo cambio — kilometraje</Label>
          <Input
            type="number"
            min={0}
            value={value.nextServiceKm ?? ""}
            onChange={(e) => set("nextServiceKm", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 95000"
          />
        </div>
        <div className="space-y-1">
          <Label>Próximo cambio — fecha</Label>
          <Input
            type="date"
            value={value.nextServiceDate ?? ""}
            onChange={(e) => set("nextServiceDate", e.target.value || undefined)}
          />
        </div>
      </div>
      <p className="text-xs text-amber-700/80">
        Si dejás estos dos campos vacíos, se sugiere automáticamente +10.000 km y +6 meses. El cliente recibe un aviso por WhatsApp cuando se acerca la fecha.
      </p>
    </div>
  );
}
