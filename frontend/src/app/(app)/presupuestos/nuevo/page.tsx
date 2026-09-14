"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { presupuestosApi, customersApi, articulosApi } from "@/lib/api";
import type { Customer, Articulo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

interface LineItem {
  articuloId: string;
  label: string;
  precio: number;
  cantidad: number;
}

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

const defaultVencimiento = () => {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
};

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [vencimiento, setVencimiento] = useState(defaultVencimiento());
  const [observacion, setObservacion] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [articuloToAdd, setArticuloToAdd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    customersApi.getAll().then(setCustomers);
    articulosApi.getAll().then((data) => setArticulos(data.filter((a) => a.activo)));
  }, []);

  const articulosDisponibles = articulos.filter((a) => !items.find((i) => i.articuloId === a.id));

  const handleAddArticulo = (id: string) => {
    if (!id) return;
    const art = articulos.find((a) => a.id === id);
    if (!art) return;
    setItems((prev) => [...prev, { articuloId: art.id, label: `${art.marca} ${art.modelo}`, precio: art.precio, cantidad: 1 }]);
    setArticuloToAdd("");
  };

  const updateCantidad = (articuloId: string, val: string) => {
    setItems((prev) => prev.map((i) => i.articuloId === articuloId ? { ...i, cantidad: Math.max(1, Math.floor(parseFloat(val) || 1)) } : i));
  };

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleSubmit = async () => {
    if (items.length === 0) { setError("Agregá al menos un artículo"); return; }

    setSaving(true);
    setError("");
    try {
      await presupuestosApi.create({
        customerId: customerId || undefined,
        vencimiento: new Date(vencimiento).toISOString(),
        observacion: observacion || undefined,
        items: items.map((i) => ({ articuloId: i.articuloId, cantidad: i.cantidad })),
      });
      toast.success("Presupuesto creado");
      router.push("/presupuestos");
    } catch {
      setError("Error al crear el presupuesto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/presupuestos")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Presupuesto</h1>
          <p className="text-sm text-gray-500 mt-0.5">El precio se toma del artículo al momento de crearlo</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Cliente</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Consumidor final</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label required>Vencimiento</Label>
            <Input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Observación</Label>
            <Input value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Todavía no agregaste artículos</p>
          ) : (
            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold">Artículo</th>
                  <th className="text-center pb-2 font-semibold w-20">Cant.</th>
                  <th className="text-right pb-2 font-semibold w-28">Precio</th>
                  <th className="text-right pb-2 font-semibold">Subtotal</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.articuloId}>
                    <td className="py-2 font-medium text-gray-900 pr-2">{item.label}</td>
                    <td className="py-2 text-center">
                      <input
                        type="number" min={1} value={item.cantidad}
                        onChange={(e) => updateCantidad(item.articuloId, e.target.value)}
                        className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 text-right text-gray-600">{fmt(item.precio)}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{fmt(item.precio * item.cantidad)}</td>
                    <td className="py-2 pl-2">
                      <button type="button" onClick={() => setItems((p) => p.filter((i) => i.articuloId !== item.articuloId))} className="text-gray-300 hover:text-red-500 transition-colors">
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
              <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={articuloToAdd}
                onChange={(e) => handleAddArticulo(e.target.value)}
                className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Agregar artículo...</option>
                {articulosDisponibles.map((a) => (
                  <option key={a.id} value={a.id}>{a.marca} {a.modelo}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-xl font-bold text-blue-600">{fmt(total)}</span>
        </CardContent>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

      <div className="flex gap-3 pb-6">
        <Button variant="outline" className="flex-1" onClick={() => router.push("/presupuestos")}>Cancelar</Button>
        <Button className="flex-1 gap-2" disabled={saving || items.length === 0} onClick={handleSubmit}>
          <FileText className="w-4 h-4" />
          {saving ? "Guardando..." : "Crear presupuesto"}
        </Button>
      </div>
    </div>
  );
}
