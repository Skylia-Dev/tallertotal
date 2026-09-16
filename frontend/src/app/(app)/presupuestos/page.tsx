"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { presupuestosApi } from "@/lib/api";
import type { PresupuestoListItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PresupuestosPage() {
  const router = useRouter();
  const [presupuestos, setPresupuestos] = useState<PresupuestoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPresupuestos(await presupuestosApi.getAll());
    } catch {
      toast.error("Error al cargar presupuestos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await presupuestosApi.delete(id);
      toast.success("Presupuesto eliminado");
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presupuestos</h1>
          <p className="text-sm text-muted-foreground mt-1">{presupuestos.length} registrados</p>
        </div>
        <Link href="/presupuestos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nuevo Presupuesto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : presupuestos.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">No hay presupuestos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-center">Artículos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuestos.map((p) => (
                    <TableRow key={p.id} className={`hover:bg-muted/60 ${p.vencido ? "opacity-60" : ""}`}>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.fecha).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="font-medium">{p.customerName ?? "Consumidor final"}</TableCell>
                      <TableCell className="text-sm">
                        <span className={p.vencido ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {new Date(p.vencimiento).toLocaleDateString("es-AR")}{p.vencido ? " (vencido)" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{p.itemsCount}</TableCell>
                      <TableCell className="text-right font-semibold">${p.total.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm" variant="outline" className="gap-1.5"
                            onClick={() => router.push(`/ventas/nueva?from=${p.id}`)}
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" /> Convertir a venta
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
