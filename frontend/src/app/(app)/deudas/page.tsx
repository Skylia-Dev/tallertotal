"use client";

import { useEffect, useState, useCallback } from "react";
import { deudasApi } from "@/lib/api";
import type { Deuda } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Wallet, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyPending, setOnlyPending] = useState(true);
  const [payTarget, setPayTarget] = useState<Deuda | null>(null);
  const [monto, setMonto] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDeudas(await deudasApi.getAll(onlyPending));
    } catch {
      toast.error("Error al cargar deudas");
    } finally {
      setLoading(false);
    }
  }, [onlyPending]);

  useEffect(() => { load(); }, [load]);

  const openPay = (d: Deuda) => { setPayTarget(d); setMonto(d.saldoPendiente); };

  const handlePay = async () => {
    if (!payTarget || monto <= 0) return;
    setSaving(true);
    try {
      await deudasApi.registrarPago(payTarget.id, monto);
      toast.success("Pago registrado");
      setPayTarget(null);
      load();
    } catch {
      toast.error("Error al registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  const totalPendiente = deudas.reduce((s, d) => s + d.saldoPendiente, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deudas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {deudas.length} registradas
            {totalPendiente > 0 && <span className="text-amber-600 font-medium"> · ${totalPendiente.toLocaleString("es-AR")} pendiente</span>}
          </p>
        </div>
        <Button
          size="sm"
          variant={onlyPending ? "default" : "outline"}
          onClick={() => setOnlyPending((v) => !v)}
        >
          Solo pendientes
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
          ) : deudas.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Wallet className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No hay deudas{onlyPending ? " pendientes" : ""}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto original</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deudas.map((d) => (
                    <TableRow key={d.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{d.customerName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{new Date(d.createdAt).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="text-right">${d.montoOriginal.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">${d.montoPagado.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={d.saldoPendiente > 0 ? "text-amber-600" : "text-green-600"}>
                          ${d.saldoPendiente.toLocaleString("es-AR")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {d.saldoPendiente > 0 && (
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPay(d)}>
                            <DollarSign className="h-3.5 w-3.5" /> Cobrar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago — {payTarget?.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-gray-500">Saldo pendiente: ${payTarget?.saldoPendiente.toLocaleString("es-AR")}</p>
            <Input
              type="number" min={0} step="0.01"
              value={monto}
              onChange={(e) => setMonto(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={handlePay} disabled={saving || monto <= 0 || (payTarget ? monto > payTarget.saldoPendiente : false)}>
              {saving ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
