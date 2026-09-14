"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ventasApi } from "@/lib/api";
import type { VentaListItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

const formaPagoLabel: Record<string, string> = {
  Contado: "Contado",
  Tarjeta: "Tarjeta",
  Transferencia: "Transferencia",
  Deuda: "Cuenta corriente",
};

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVentas(await ventasApi.getAll());
    } catch {
      toast.error("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">{ventas.length} registradas</p>
        </div>
        <Link href="/ventas/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nueva Venta
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
          ) : ventas.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Receipt className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No hay ventas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Artículos</TableHead>
                    <TableHead>Forma de pago</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.map((v) => (
                    <TableRow key={v.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">{new Date(v.fecha).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="font-medium">{v.customerName ?? "Consumidor final"}</TableCell>
                      <TableCell className="text-center">{v.itemsCount}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formaPagoLabel[v.formaPago] ?? v.formaPago}</TableCell>
                      <TableCell className="text-right font-semibold">${v.total.toLocaleString("es-AR")}</TableCell>
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
