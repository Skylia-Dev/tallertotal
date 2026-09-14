"use client";

import { useEffect, useState } from "react";
import { tenantModuleConfigApi } from "@/lib/api";
import { HIDEABLE_MODULES } from "@/lib/modules";
import { useModuleConfig } from "@/contexts/ModuleConfigContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Settings } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracionPage() {
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const { hiddenModules, refresh } = useModuleConfig();
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setIsOwner(match ? decodeURIComponent(match[1]) === "Owner" : false);
  }, []);

  useEffect(() => { setLocalHidden(new Set(hiddenModules)); }, [hiddenModules]);

  const toggle = (key: string) => {
    setLocalHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantModuleConfigApi.update(Array.from(localHidden));
      toast.success("Cambios guardados");
      await refresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (isOwner === null) return null;

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto" />
        <p className="text-sm text-gray-500">Solo el dueño del taller puede cambiar la configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Personalizá qué se ve en el sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" /> Módulos visibles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Desmarcá los módulos que este taller no usa — desaparecen del menú para todos los usuarios.
            Dashboard, Empleados y Configuración siempre quedan visibles.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
            {HIDEABLE_MODULES.map((m) => (
              <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={!localHidden.has(m.key)}
                  onChange={() => toggle(m.key)}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                />
                {m.label}
              </label>
            ))}
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
