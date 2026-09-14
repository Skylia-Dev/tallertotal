"use client";

import { useEffect, useState, useCallback } from "react";
import { activityLogsApi } from "@/lib/api";
import type { ActivityLogItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";

export default function AuditoriaPage() {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityLogsApi.getAll({ page, pageSize });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      toast.error("Error al cargar la auditoría");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de acciones sobre compras, ventas, deudas y caja</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Actividad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <History className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No hay actividad registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((l) => (
                    <TableRow key={l.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-600">{new Date(l.createdAt).toLocaleString("es-AR")}</TableCell>
                      <TableCell className="font-medium">{l.username}</TableCell>
                      <TableCell className="text-sm text-gray-500">{l.action}</TableCell>
                      <TableCell className="text-sm text-gray-700">{l.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
