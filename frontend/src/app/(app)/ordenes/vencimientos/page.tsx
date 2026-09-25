"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { serviceOrdersApi } from "@/lib/api";
import type { UpcomingLubricentro } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, MessageCircle, Droplets } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<UpcomingLubricentro["dueStatus"], { label: string; icon: typeof AlertTriangle; cls: string }> = {
  Vencido:  { label: "Vencido",       icon: AlertTriangle, cls: "border-red-200 bg-red-50 text-red-700" },
  Proximo:  { label: "Próximo a vencer", icon: Clock,       cls: "border-amber-200 bg-amber-50 text-amber-700" },
  AlDia:    { label: "Al día",        icon: CheckCircle,   cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

function waLink(phone: string, plate: string, portalToken: string) {
  const digits = phone.replace(/\D/g, "");
  const link = typeof window !== "undefined" ? `${window.location.origin}/libreta/${portalToken}` : "";
  const text = encodeURIComponent(
    `Hola! Te escribimos de tu taller: el cambio de aceite de tu ${plate} está por vencer. ¿Coordinamos un turno? Acá tenés el historial de tu vehículo: ${link}`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export default function VencimientosPage() {
  const [items, setItems] = useState<UpcomingLubricentro[] | null>(null);

  useEffect(() => {
    serviceOrdersApi.getUpcomingLubricentro()
      .then(setItems)
      .catch(() => { toast.error("No se pudieron cargar los vencimientos"); setItems([]); });
  }, []);

  const groups: UpcomingLubricentro["dueStatus"][] = ["Vencido", "Proximo", "AlDia"];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/ordenes" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Droplets className="h-5 w-5 text-amber-600" />
            Vencimientos de Lubricentro
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Próximo cambio de aceite por vehículo, según km y fecha</p>
        </div>
      </div>

      {items === null ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Todavía no hay órdenes de Lubricentro completadas con próximo cambio registrado.
        </div>
      ) : (
        groups.map((status) => {
          const group = items.filter((i) => i.dueStatus === status);
          if (group.length === 0) return null;
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="space-y-2">
              <h2 className={`text-sm font-semibold flex items-center gap-1.5 ${cfg.cls.split(" ")[2]}`}>
                <cfg.icon className="h-4 w-4" /> {cfg.label} ({group.length})
              </h2>
              <div className="space-y-2">
                {group.map((v) => (
                  <Card key={v.vehicleId} className={`border-l-4 ${cfg.cls.split(" ")[0]}`}>
                    <CardContent className="py-3 flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold font-mono text-foreground">{v.licensePlate} <span className="font-sans font-normal text-muted-foreground">— {v.vehicleDescription}</span></p>
                        <p className="text-xs text-muted-foreground">{v.customerName} · {v.customerPhone}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {v.nextServiceDate && (
                          <span>
                            Próx. fecha: <span className="font-medium">{new Date(v.nextServiceDate + "T00:00:00").toLocaleDateString("es-AR")}</span>
                            {v.daysRemaining !== null && v.daysRemaining !== undefined && (
                              <span className="text-muted-foreground"> ({v.daysRemaining <= 0 ? `venció hace ${Math.abs(v.daysRemaining)}d` : `en ${v.daysRemaining}d`})</span>
                            )}
                          </span>
                        )}
                        {v.nextServiceKm && (
                          <span>
                            Próx. km: <span className="font-medium">{v.nextServiceKm.toLocaleString("es-AR")}</span>
                            {v.kmRemaining !== null && v.kmRemaining !== undefined && (
                              <span className="text-muted-foreground"> ({v.kmRemaining <= 0 ? `superado por ${Math.abs(v.kmRemaining).toLocaleString("es-AR")}km` : `faltan ${v.kmRemaining.toLocaleString("es-AR")}km`})</span>
                            )}
                          </span>
                        )}
                        <a
                          href={waLink(v.customerPhone, v.licensePlate, v.vehiclePortalToken)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"}
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Contactar
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
