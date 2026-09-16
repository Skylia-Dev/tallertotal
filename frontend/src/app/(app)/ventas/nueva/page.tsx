"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ventasApi, customersApi, articulosApi, presupuestosApi } from "@/lib/api";
import type { Customer, Articulo, PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  articuloId: string;
  label: string;
  precio: number;
  cantidad: number;
  stockDisponible: number;
}

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

const formasPago: { value: PaymentMethod; label: string }[] = [
  { value: "Contado", label: "Contado" },
  { value: "Tarjeta", label: "Tarjeta" },
  { value: "Transferencia", label: "Transferencia" },
  { value: "Deuda", label: "Cuenta corriente (queda a deber)" },
];

export default function NuevaVentaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaVentaForm />
    </Suspense>
  );
}

function NuevaVentaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPresupuestoId = searchParams.get("from");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [formaPago, setFormaPago] = useState<PaymentMethod>("Contado");
  const [descuento, setDescuento] = useState(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [articuloToAdd, setArticuloToAdd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    customersApi.getAll().then(setCustomers);
    articulosApi.getAll().then((data) => setArticulos(data.filter((a) => a.activo && a.stock > 0)));
  }, []);

  useEffect(() => {
    if (!fromPresupuestoId) return;
    presupuestosApi.getById(fromPresupuestoId).then((p) => {
      if (p.customerId) setCustomerId(p.customerId);
      setItems(p.items.map((i) => ({
        articuloId: i.articuloId,
        label: i.articuloNombre,
        precio: i.precioUnitario,
        cantidad: Math.min(i.cantidad, Math.max(1, i.stock)),
        stockDisponible: i.stock,
      })));
      toast.info("Se precargó el presupuesto. Revisá stock y precios antes de confirmar.");
    }).catch(() => toast.error("No se pudo cargar el presupuesto"));
  }, [fromPresupuestoId]);

  const articulosDisponibles = articulos.filter((a) => !items.find((i) => i.articuloId === a.id));

  const handleAddArticulo = (id: string) => {
    if (!id) return;
    const art = articulos.find((a) => a.id === id);
    if (!art) return;
    setItems((prev) => [...prev, { articuloId: art.id, label: `${art.marca} ${art.modelo}`, precio: art.precio, cantidad: 1, stockDisponible: art.stock }]);
    setArticuloToAdd("");
  };

  const updateItem = (articuloId: string, field: "cantidad" | "precio", val: string) => {
    setItems((prev) => prev.map((i) => {
      if (i.articuloId !== articuloId) return i;
      const n = parseFloat(val) || 0;
      return { ...i, [field]: field === "cantidad" ? Math.max(1, Math.min(i.stockDisponible, Math.floor(n))) : Math.max(0, n) };
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = Math.max(0, subtotal - descuento);

  const handleSubmit = async () => {
    if (items.length === 0) { setError("Agregá al menos un artículo"); return; }
    if (formaPago === "Deuda" && !customerId) { setError("Para vender a cuenta corriente seleccioná un cliente"); return; }

    setSaving(true);
    setError("");
    try {
      await ventasApi.create({
        customerId: customerId || undefined,
        descuento,
        formaPago,
        items: items.map((i) => ({ articuloId: i.articuloId, cantidad: i.cantidad, precioUnitario: i.precio })),
      });
      toast.success("Venta registrada");
      router.push("/ventas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/ventas")} className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Venta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Venta directa de mostrador</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Cliente</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
            >
              <option value="">Consumidor final</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label required>Forma de pago</Label>
            <select
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value as PaymentMethod)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
            >
              {formasPago.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Artículos vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Todavía no agregaste artículos</p>
          ) : (
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 font-semibold">Artículo</th>
                  <th className="text-center pb-2 font-semibold w-20">Cant.</th>
                  <th className="text-right pb-2 font-semibold w-32">Precio</th>
                  <th className="text-right pb-2 font-semibold">Subtotal</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.articuloId}>
                    <td className="py-2 font-medium text-foreground pr-2">
                      {item.label}
                      <span className="block text-xs text-muted-foreground font-normal">stock: {item.stockDisponible}</span>
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number" min={1} max={item.stockDisponible} value={item.cantidad}
                        onChange={(e) => updateItem(item.articuloId, "cantidad", e.target.value)}
                        className="w-16 border border-border rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number" min={0} step="0.01" value={item.precio}
                        onChange={(e) => updateItem(item.articuloId, "precio", e.target.value)}
                        className="w-28 border border-border rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 text-right font-semibold text-foreground">{fmt(item.precio * item.cantidad)}</td>
                    <td className="py-2 pl-2">
                      <button type="button" onClick={() => setItems((p) => p.filter((i) => i.articuloId !== item.articuloId))} className="text-muted-foreground/50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {articulosDisponibles.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <select
                value={articuloToAdd}
                onChange={(e) => handleAddArticulo(e.target.value)}
                className="flex-1 border border-dashed border-border rounded-lg px-3 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 bg-card"
              >
                <option value="">Agregar artículo...</option>
                {articulosDisponibles.map((a) => (
                  <option key={a.id} value={a.id}>{a.marca} {a.modelo} (stock: {a.stock})</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <Label className="shrink-0">Descuento</Label>
            <input
              type="number" min={0} step="0.01" value={descuento}
              onChange={(e) => setDescuento(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-32 border border-border rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-xl font-bold text-blue-600">{fmt(total)}</span>
          </div>
        </CardContent>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

      <div className="flex gap-3 pb-6">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/ventas")}>Cancelar</Button>
        <Button className="flex-1 gap-2" disabled={saving || items.length === 0} onClick={handleSubmit}>
          <Receipt className="w-4 h-4" />
          {saving ? "Registrando..." : "Confirmar venta"}
        </Button>
      </div>
    </div>
  );
}
