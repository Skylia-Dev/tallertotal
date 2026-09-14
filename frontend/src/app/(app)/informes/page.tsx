"use client";

import { useEffect, useState, useCallback } from "react";
import { informesApi } from "@/lib/api";
import type { InformeResumen, VentaPorDia, TopArticulo, StockBajo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TicketPercent, ShoppingBag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export default function InformesPage() {
  const [desde, setDesde] = useState(firstDayOfMonth());
  const [hasta, setHasta] = useState(today());
  const [resumen, setResumen] = useState<InformeResumen | null>(null);
  const [ventasPorDia, setVentasPorDia] = useState<VentaPorDia[]>([]);
  const [topArticulos, setTopArticulos] = useState<TopArticulo[]>([]);
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, vpd, ta, sb] = await Promise.all([
        informesApi.getResumen(desde, hasta),
        informesApi.getVentasPorDia(desde, hasta),
        informesApi.getTopArticulos(desde, hasta),
        informesApi.getStockBajo(),
      ]);
      setResumen(r);
      setVentasPorDia(vpd);
      setTopArticulos(ta);
      setStockBajo(sb);
    } catch {
      toast.error("Error al cargar informes");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes</h1>
          <p className="text-sm text-gray-500 mt-1">Ventas, compras y stock</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-36" />
          </div>
        </div>
      </div>

      {loading || !resumen ? (
        <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><DollarSign className="h-3.5 w-3.5" /> Ventas</div>
                <p className="text-xl font-bold text-gray-900">{fmt(resumen.totalVentas)}</p>
                <p className="text-xs text-gray-400">{resumen.cantidadVentas} ventas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><TicketPercent className="h-3.5 w-3.5" /> Ticket promedio</div>
                <p className="text-xl font-bold text-gray-900">{fmt(resumen.ticketPromedio)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><ShoppingBag className="h-3.5 w-3.5" /> Compras</div>
                <p className="text-xl font-bold text-gray-900">{fmt(resumen.totalCompras)}</p>
                <p className="text-xs text-gray-400">{resumen.cantidadCompras} compras</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1"><AlertTriangle className="h-3.5 w-3.5" /> Stock bajo</div>
                <p className="text-xl font-bold text-amber-600">{stockBajo.length}</p>
                <p className="text-xs text-gray-400">artículos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Ventas por día</CardTitle></CardHeader>
              <CardContent>
                {ventasPorDia.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos en el período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ventasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                      <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Ventas por forma de pago</CardTitle></CardHeader>
              <CardContent>
                {resumen.ventasPorFormaPago.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos en el período</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={resumen.ventasPorFormaPago} dataKey="total" nameKey="formaPago" cx="50%" cy="50%" outerRadius={80} label={(e) => String(e.name ?? "")}>
                        {resumen.ventasPorFormaPago.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Artículos más vendidos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {topArticulos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos en el período</p>
                ) : topArticulos.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-900">{a.articulo}</span>
                    <span className="text-gray-500">{a.unidadesVendidas} un. · {fmt(a.totalVendido)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Stock bajo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {stockBajo.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin artículos con stock bajo</p>
                ) : stockBajo.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="font-medium text-gray-900">{a.marca} {a.modelo}</span>
                    <span className="text-amber-600 font-semibold">{a.stock} un.</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
