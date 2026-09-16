"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { serviceOrdersApi, dashboardApi } from "@/lib/api";
import type { ServiceOrder, ServiceOrderStatus, DashboardMetrics } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { SortableWidget } from "@/components/SortableWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, CheckCircle,
  TrendingUp, TrendingDown, Minus, DollarSign,
  TicketPercent, AlertTriangle, ShoppingCart, Wallet, FileText,
  PackageX, Droplets, UserPlus, Settings2, Plus, type LucideIcon,
} from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  rectSortingStrategy, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DASHBOARD_WIDGET_CATALOG, DASHBOARD_WIDGET_MAP, DEFAULT_DASHBOARD_WIDGETS,
  resolveDashboardWidgets, type DashboardWidgetKey,
} from "@/lib/dashboard-widgets";

const STATUS_TABS: { value: ServiceOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "Open", label: "Abiertas" },
  { value: "InProgress", label: "En progreso" },
  { value: "Completed", label: "Completadas" },
];

const STATUS_COLORS: Record<string, string> = {
  Open: "#0ea5e9",
  InProgress: "#f59e0b",
  Completed: "#10b981",
  Cancelled: "#ef4444",
};

const fmt = (n: number) =>
  "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });

// ── Widgets del dashboard personalizable ────────────────────────────────────────

const COLOR_CLASSES: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  emerald: { border: "border-l-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  blue:    { border: "border-l-blue-500",    iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  violet:  { border: "border-l-violet-500",  iconBg: "bg-violet-50",  iconColor: "text-violet-600" },
  teal:    { border: "border-l-teal-500",    iconBg: "bg-teal-50",    iconColor: "text-teal-600" },
  red:     { border: "border-l-red-500",     iconBg: "bg-red-50",     iconColor: "text-red-500" },
  gray:    { border: "border-l-border",       iconBg: "bg-muted",     iconColor: "text-muted-foreground" },
  cyan:    { border: "border-l-cyan-500",    iconBg: "bg-cyan-50",    iconColor: "text-cyan-600" },
  amber:   { border: "border-l-amber-500",   iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
  indigo:  { border: "border-l-indigo-500",  iconBg: "bg-indigo-50",  iconColor: "text-indigo-600" },
  green:   { border: "border-l-green-500",   iconBg: "bg-green-50",   iconColor: "text-green-600" },
  pink:    { border: "border-l-pink-500",    iconBg: "bg-pink-50",    iconColor: "text-pink-600" },
};

function KpiCardContent({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: LucideIcon; color: string; sub?: React.ReactNode;
}) {
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.gray;
  return (
    <Card className={`border-l-4 ${c.border} h-full`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-foreground mt-1 truncate">{value}</p>
            {sub}
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ${c.iconBg}`}>
            <Icon className={`h-5 w-5 ${c.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function renderKpiWidget(
  key: DashboardWidgetKey,
  metrics: DashboardMetrics | null,
  revDelta: number | null,
  ordDelta: number | null
) {
  switch (key) {
    case "revenueThisMonth":
      return <KpiCardContent label="Ingresos del mes" value={fmt(metrics?.revenueThisMonth ?? 0)} icon={DollarSign} color="emerald" sub={<DeltaBadge delta={revDelta} />} />;
    case "ordersThisMonth":
      return <KpiCardContent label="Órdenes del mes" value={String(metrics?.ordersThisMonth ?? 0)} icon={ClipboardList} color="blue" sub={<DeltaBadge delta={ordDelta} />} />;
    case "avgTicket":
      return <KpiCardContent label="Ticket promedio" value={fmt(metrics?.avgTicket ?? 0)} icon={TicketPercent} color="violet" sub={<p className="text-xs text-muted-foreground mt-1">órdenes completadas</p>} />;
    case "completionRate":
      return <KpiCardContent label="Tasa completado" value={`${(metrics?.completionRate ?? 0).toFixed(1)}%`} icon={CheckCircle} color="teal" sub={<p className="text-xs text-muted-foreground mt-1">del mes actual</p>} />;
    case "overdueCount":
      return <KpiCardContent label="Órdenes vencidas" value={String(metrics?.overdueCount ?? 0)} icon={AlertTriangle} color={(metrics?.overdueCount ?? 0) > 0 ? "red" : "gray"} sub={<p className="text-xs text-muted-foreground mt-1">plazo superado</p>} />;
    case "ventasThisMonth":
      return <KpiCardContent label="Ventas del mes" value={fmt(metrics?.ventasThisMonth ?? 0)} icon={ShoppingCart} color="cyan" sub={<p className="text-xs text-muted-foreground mt-1">mostrador + POS</p>} />;
    case "deudasPendientes":
      return <KpiCardContent label="Deudas pendientes" value={fmt(metrics?.deudasPendientesTotal ?? 0)} icon={Wallet} color="amber" sub={<p className="text-xs text-muted-foreground mt-1">saldo por cobrar</p>} />;
    case "presupuestosVigentes":
      return <KpiCardContent label="Presupuestos vigentes" value={String(metrics?.presupuestosVigentes ?? 0)} icon={FileText} color="indigo" sub={<p className="text-xs text-muted-foreground mt-1">no vencidos</p>} />;
    case "cajaBalance":
      return <KpiCardContent label="Balance de caja" value={fmt(metrics?.cajaBalance ?? 0)} icon={Wallet} color="green" />;
    case "articulosStockBajo":
      return <KpiCardContent label="Stock bajo" value={String(metrics?.articulosStockBajo ?? 0)} icon={PackageX} color={(metrics?.articulosStockBajo ?? 0) > 0 ? "red" : "gray"} sub={<p className="text-xs text-muted-foreground mt-1">artículos activos</p>} />;
    case "lubricentroVencimientos":
      return <KpiCardContent label="Vencimientos lubricentro" value={String(metrics?.lubricentroVencimientos ?? 0)} icon={Droplets} color="amber" sub={<p className="text-xs text-muted-foreground mt-1">próx. 30 días</p>} />;
    case "clientesNuevos":
      return <KpiCardContent label="Clientes nuevos" value={String(metrics?.clientesNuevosEsteMes ?? 0)} icon={UserPlus} color="pink" sub={<p className="text-xs text-muted-foreground mt-1">este mes</p>} />;
    default:
      return null;
  }
}

function OfficeDashboard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dashboard personalizable
  const [editMode, setEditMode] = useState(false);
  const [smOrder, setSmOrder] = useState<DashboardWidgetKey[]>(
    DEFAULT_DASHBOARD_WIDGETS.filter((k) => DASHBOARD_WIDGET_MAP[k].size === "sm")
  );
  const [lgOrder, setLgOrder] = useState<DashboardWidgetKey[]>(
    DEFAULT_DASHBOARD_WIDGETS.filter((k) => DASHBOARD_WIDGET_MAP[k].size === "lg")
  );
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    dashboardApi.getLayout()
      .then((res) => {
        const resolved = resolveDashboardWidgets(res.layout);
        setSmOrder(resolved.filter((k) => DASHBOARD_WIDGET_MAP[k].size === "sm"));
        setLgOrder(resolved.filter((k) => DASHBOARD_WIDGET_MAP[k].size === "lg"));
      })
      .catch(() => {});
  }, []);

  const persistLayout = useCallback(async (nextSm: DashboardWidgetKey[], nextLg: DashboardWidgetKey[]) => {
    setSmOrder(nextSm);
    setLgOrder(nextLg);
    try {
      await dashboardApi.setLayout([...nextSm, ...nextLg]);
    } catch {
      toast.error("No se pudo guardar el dashboard");
    }
  }, []);

  const handleHideWidget = (key: DashboardWidgetKey) => {
    if (DASHBOARD_WIDGET_MAP[key].size === "sm") persistLayout(smOrder.filter((k) => k !== key), lgOrder);
    else persistLayout(smOrder, lgOrder.filter((k) => k !== key));
  };

  const handleAddWidget = (key: DashboardWidgetKey) => {
    setAddMenuOpen(false);
    if (DASHBOARD_WIDGET_MAP[key].size === "sm") persistLayout([...smOrder, key], lgOrder);
    else persistLayout(smOrder, [...lgOrder, key]);
  };

  const handleSmDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = smOrder.indexOf(active.id as DashboardWidgetKey);
    const newIndex = smOrder.indexOf(over.id as DashboardWidgetKey);
    persistLayout(arrayMove(smOrder, oldIndex, newIndex), lgOrder);
  };

  const handleLgDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lgOrder.indexOf(active.id as DashboardWidgetKey);
    const newIndex = lgOrder.indexOf(over.id as DashboardWidgetKey);
    persistLayout(smOrder, arrayMove(lgOrder, oldIndex, newIndex));
  };

  const hiddenWidgets = DASHBOARD_WIDGET_CATALOG.filter(
    (w) => !smOrder.includes(w.key) && !lgOrder.includes(w.key)
  );

  const loadAll = useCallback(async () => {
    try {
      const [data, m] = await Promise.all([
        serviceOrdersApi.getAll(),
        dashboardApi.getMetrics(),
      ]);
      setAllOrders(data);
      setMetrics(m);
    } catch {
      // silently ignore
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await serviceOrdersApi.getAll(
        activeTab !== "all" ? { status: activeTab } : undefined
      );
      setOrders(data);
    } catch {
      toast.error("No se pudo cargar las órdenes");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [activeTab, search, pageSize]);

  const handleStatusChange = async (id: string, status: ServiceOrderStatus) => {
    try {
      await serviceOrdersApi.updateStatus(id, status);
      toast.success("Estado actualizado");
      load();
      loadAll();
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.licensePlate.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.assignedMechanic ?? "").toLowerCase().includes(q)
    );
  });

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  // Delta helpers
  const delta = (current: number, previous: number) => {
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  const revDelta = delta(metrics?.revenueThisMonth ?? 0, metrics?.revenueLastMonth ?? 0);
  const ordDelta = delta(metrics?.ordersThisMonth ?? 0, metrics?.ordersLastMonth ?? 0);

  const monthName = new Date().toLocaleString("es-AR", { month: "long" });

  // Pie chart data
  const pieData = (metrics?.ordersByStatus ?? []).map((s) => ({
    name: statusLabel(s.status),
    value: s.count,
    key: s.status,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            Resumen del taller · {monthName} {new Date().getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && hiddenWidgets.length > 0 && (
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setAddMenuOpen((v) => !v)}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Agregar tarjeta
              </Button>
              {addMenuOpen && (
                <div className="absolute right-0 z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border bg-card shadow-lg py-1">
                  {hiddenWidgets.map((w) => (
                    <button
                      key={w.key}
                      onClick={() => handleAddWidget(w.key)}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center justify-between gap-2"
                    >
                      {w.label}
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditMode((v) => !v)} className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            {editMode ? "Listo" : "Personalizar"}
          </Button>
        </div>
      </div>

      {/* KPI cards — personalizables */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSmDragEnd}>
        <SortableContext items={smOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {smOrder.map((key) => (
              <SortableWidget key={key} id={key} editMode={editMode} onHide={() => handleHideWidget(key)}>
                {renderKpiWidget(key, metrics, revDelta, ordDelta)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Gráficos — personalizables */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLgDragEnd}>
        <SortableContext items={lgOrder} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lgOrder.map((key) => (
              <SortableWidget key={key} id={key} editMode={editMode} onHide={() => handleHideWidget(key)}>
                {key === "ingresosChart" && (
                  <ChartCard title="Ingresos últimos 6 meses">
                    {(metrics?.monthlyStats?.length ?? 0) === 0 ? (
                      <EmptyChart />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={metrics!.monthlyStats} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                          <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => "$" + (v as number).toLocaleString("es-AR")}
                            width={70}
                          />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [fmt(Number(value) || 0), "Ingresos"]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                          />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                )}

                {key === "ordenesChart" && (
                  <ChartCard title="Órdenes últimos 6 meses">
                    {(metrics?.monthlyStats?.length ?? 0) === 0 ? (
                      <EmptyChart />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={metrics!.monthlyStats} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                          <YAxis
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            width={32}
                          />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any) => [Number(value) || 0, "Órdenes"]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                          />
                          <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                )}

                {key === "estadoChart" && (
                  <ChartCard title="Órdenes por estado">
                    {pieData.length === 0 ? (
                      <EmptyChart />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#94a3b8"} />
                            ))}
                          </Pie>
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, _: any, props: any) => {
                              const v = Number(value) || 0;
                              return [`${v} orden${v !== 1 ? "es" : ""}`, props?.payload?.name ?? ""];
                            }}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                          />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => (
                              <span style={{ fontSize: 12, color: "var(--foreground)" }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                )}

                {key === "mecanicoChart" && (
                  <ChartCard title="Rendimiento por mecánico este mes">
                    {(metrics?.mechanicStats?.length ?? 0) === 0 ? (
                      <EmptyChart label="Sin datos este mes" />
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          layout="vertical"
                          data={metrics!.mechanicStats}
                          margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                            width={90}
                          />
                          <Tooltip
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, name: any) => {
                              const v = Number(value) || 0;
                              return name === "orders"
                                ? [`${v} orden${v !== 1 ? "es" : ""}`, "Órdenes"]
                                : [fmt(v), "Ingresos"];
                            }}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
                          />
                          <Bar dataKey="orders" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="orders" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </ChartCard>
                )}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Orders table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Órdenes de Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="Buscar por placa, cliente o mecánico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No hay órdenes que mostrar</div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {paginated.map((order) => (
                  <div key={order.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-foreground">{order.licensePlate}</span>
                        <p className="text-sm text-muted-foreground mt-0.5">{order.vehicleDescription}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-foreground">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        ${order.totalEstimate.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("es-AR")}
                        {order.assignedMechanic && ` · ${order.assignedMechanic}`}
                      </p>
                      <Select
                        value={order.status}
                        onValueChange={(v) => handleStatusChange(order.id, v as ServiceOrderStatus)}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Abierta</SelectItem>
                          <SelectItem value="InProgress">En progreso</SelectItem>
                          <SelectItem value="Completed">Completada</SelectItem>
                          <SelectItem value="Cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead>Placa</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Mecánico</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total estimado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cambiar estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted">
                        <TableCell className="font-mono font-semibold text-sm">{order.licensePlate}</TableCell>
                        <TableCell className="text-sm">{order.vehicleDescription}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.assignedMechanic ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          ${order.totalEstimate.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleStatusChange(order.id, v as ServiceOrderStatus)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Abierta</SelectItem>
                              <SelectItem value="InProgress">En progreso</SelectItem>
                              <SelectItem value="Completed">Completada</SelectItem>
                              <SelectItem value="Cancelled">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          <Pagination
            total={filtered.length}
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

// ── Helper components ──────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <p className="text-xs text-muted-foreground mt-1">sin datos previos</p>;
  const up = delta >= 0;
  return (
    <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? "text-emerald-600" : "text-red-500"}`}>
      {delta > 0
        ? <TrendingUp className="h-3 w-3" />
        : delta < 0
        ? <TrendingDown className="h-3 w-3" />
        : <Minus className="h-3 w-3" />}
      {delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs mes anterior
    </p>
  );
}

function EmptyChart({ label = "Sin datos" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Open: "Abiertas",
    InProgress: "En progreso",
    Completed: "Completadas",
    Cancelled: "Canceladas",
  };
  return map[status] ?? status;
}

// ── Dashboard restringido para el rol Mecánico ──────────────────────────────────
// Nada de ingresos ni métricas del taller — solo un resumen de SUS órdenes.

function MechanicDashboard() {
  const [orders, setOrders] = useState<ServiceOrder[] | null>(null);

  useEffect(() => {
    serviceOrdersApi.getMine().then(setOrders).catch(() => setOrders([]));
  }, []);

  const activas = orders?.filter((o) => o.status === "Open" || o.status === "InProgress").length ?? 0;
  const completadasEsteMes = orders?.filter((o) => {
    if (o.status !== "Completed" || !o.completedAt) return false;
    const d = new Date(o.completedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;
  const vencidas = orders?.filter((o) => {
    if (o.status === "Completed" || o.status === "Cancelled" || !o.estimatedDeliveryAt) return false;
    return new Date(o.estimatedDeliveryAt) < new Date();
  }).length ?? 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tu trabajo</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Activas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{orders === null ? "—" : activas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Completadas este mes</p>
            <p className="text-2xl font-bold text-foreground mt-1">{orders === null ? "—" : completadasEsteMes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vencidas</p>
            <p className="text-2xl font-bold text-foreground mt-1">{orders === null ? "—" : vencidas}</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Para el detalle de cada orden, andá a <span className="font-medium text-muted-foreground">Mis Órdenes</span> en el menú.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setRole(match ? decodeURIComponent(match[1]) : null);
  }, []);

  if (role === null) return null;
  return role === "Mechanic" ? <MechanicDashboard /> : <OfficeDashboard />;
}

