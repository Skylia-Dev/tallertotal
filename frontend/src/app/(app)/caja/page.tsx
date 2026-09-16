"use client";

import { useEffect, useState, useCallback } from "react";
import { cajaApi } from "@/lib/api";
import type { CajaResumen, CajaMovimientoTipo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

const tipoLabel: Record<CajaMovimientoTipo, string> = {
  Apertura: "Apertura",
  Cierre: "Cierre",
  Arqueo: "Arqueo",
  Retiro: "Retiro",
  Ingreso: "Ingreso",
};

const tipoColor: Record<CajaMovimientoTipo, string> = {
  Apertura: "bg-blue-100 text-blue-700",
  Ingreso: "bg-green-100 text-green-700",
  Retiro: "bg-red-100 text-red-700",
  Cierre: "bg-muted text-foreground",
  Arqueo: "bg-amber-100 text-amber-700",
};

export default function CajaPage() {
  const [resumen, setResumen] = useState<CajaResumen>({ movimientos: [], balance: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<CajaMovimientoTipo>("Ingreso");
  const [monto, setMonto] = useState(0);
  const [observacion, setObservacion] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResumen(await cajaApi.getAll());
    } catch {
      toast.error("Error al cargar la caja");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setTipo("Ingreso"); setMonto(0); setObservacion(""); setOpen(true); };

  const handleSave = async () => {
    if (monto <= 0) return;
    setSaving(true);
    try {
      await cajaApi.create({ tipo, monto, observacion: observacion || undefined });
      toast.success("Movimiento registrado");
      setOpen(false);
      load();
    } catch {
      toast.error("Error al registrar el movimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Caja</h1>
          <p className="text-sm text-muted-foreground mt-1">Balance actual:<span className={`font-semibold ${resumen.balance >= 0 ? "text-green-600" : "text-red-600"}`}>${resumen.balance.toLocaleString("es-AR")}</span></p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo Movimiento
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo movimiento de caja</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label required>Tipo</Label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as CajaMovimientoTipo)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
                >
                  {Object.entries(tipoLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label required>Monto</Label>
                <Input type="number" min={0} step="0.01" value={monto} onChange={(e) => setMonto(Math.max(0, parseFloat(e.target.value) || 0))} />
              </div>
              <div className="space-y-1">
                <Label>Observación</Label>
                <Input value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button onClick={handleSave} disabled={saving || monto <= 0}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : resumen.movimientos.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Wallet className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Observación</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumen.movimientos.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/60">
                      <TableCell className="text-sm text-muted-foreground">{new Date(m.fecha).toLocaleString("es-AR")}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tipoColor[m.tipo]}`}>
                          {m.tipo === "Ingreso" || m.tipo === "Apertura" ? <ArrowUpCircle className="h-3 w-3" /> : m.tipo === "Retiro" ? <ArrowDownCircle className="h-3 w-3" /> : null}
                          {tipoLabel[m.tipo]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.observacion ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.createdByUsername}</TableCell>
                      <TableCell className="text-right font-semibold">${m.monto.toLocaleString("es-AR")}</TableCell>
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
