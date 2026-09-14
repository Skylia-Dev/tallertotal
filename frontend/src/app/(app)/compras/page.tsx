"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { comprasApi } from "@/lib/api";
import type { CompraListItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function ComprasPage() {
  const [compras, setCompras] = useState<CompraListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCompras(await comprasApi.getAll());
    } catch {
      toast.error("Error al cargar compras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-1">{compras.length} registradas</p>
        </div>
        <Link href="/compras/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Nueva Compra
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
          ) : compras.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No hay compras registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-center">Artículos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Saldo pendiente</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">{new Date(c.fecha).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="font-medium">{c.proveedorNombre}</TableCell>
                      <TableCell className="text-center">{c.itemsCount}</TableCell>
                      <TableCell className="text-right">${c.total.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {c.saldoPendiente > 0 ? `$${c.saldoPendiente.toLocaleString("es-AR")}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.saldoPendiente === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {c.saldoPendiente === 0 ? "Pagada" : "Pendiente"}
                        </span>
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
