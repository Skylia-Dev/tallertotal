"use client";

import { useEffect, useState } from "react";
import { serviceOrdersApi } from "@/lib/api";
import type { ServiceOrder } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

function OrderCard({ order }: { order: ServiceOrder }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-foreground">{order.licensePlate} — {order.vehicleDescription}</p>
            <p className="text-sm text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.diagnosisNotes && (
          <p className="text-sm text-muted-foreground">{order.diagnosisNotes}</p>
        )}

        {order.items.length > 0 && (
          <ul className="text-sm text-muted-foreground border-t pt-2 space-y-1">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.quantity}× {i.description}</span>
                <span className="text-muted-foreground">{fmt(i.total)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <span>Ingresó el {new Date(order.createdAt).toLocaleDateString("es-AR")}</span>
          {order.estimatedDeliveryAt && (
            <span>Entrega estimada: {new Date(order.estimatedDeliveryAt).toLocaleDateString("es-AR")}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, orders }: { title: string; orders: ServiceOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="space-y-3">
        {orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

export default function MisOrdenesPage() {
  const [orders, setOrders] = useState<ServiceOrder[] | null>(null);

  useEffect(() => {
    serviceOrdersApi.getMine()
      .then(setOrders)
      .catch(() => toast.error("No se pudieron cargar tus órdenes"));
  }, []);

  const activas = orders?.filter((o) => o.status === "Open" || o.status === "InProgress") ?? [];
  const pasadas = orders?.filter((o) => o.status === "Completed" || o.status === "Cancelled") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Órdenes</h1>
        <p className="text-sm text-muted-foreground mt-1">Órdenes de servicio asignadas a vos</p>
      </div>

      {orders === null ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-2">
            <ClipboardList className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">No tenés órdenes asignadas todavía</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <Section title="Activas" orders={activas} />
          <Section title="Historial" orders={pasadas} />
        </div>
      )}
    </div>
  );
}
