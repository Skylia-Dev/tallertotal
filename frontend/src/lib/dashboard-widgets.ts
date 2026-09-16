// Catálogo de widgets del dashboard personalizable.
// Mantener en sync con DashboardWidgetCatalog.cs (backend/TallerTotal.Api/Services).

export type DashboardWidgetKey =
  | "revenueThisMonth" | "ordersThisMonth" | "avgTicket" | "completionRate" | "overdueCount"
  | "ventasThisMonth" | "deudasPendientes" | "presupuestosVigentes" | "cajaBalance"
  | "articulosStockBajo" | "lubricentroVencimientos" | "clientesNuevos"
  | "ingresosChart" | "ordenesChart" | "estadoChart" | "mecanicoChart";

export interface DashboardWidgetMeta {
  key: DashboardWidgetKey;
  label: string;
  size: "sm" | "lg";
}

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetMeta[] = [
  { key: "revenueThisMonth", label: "Ingresos del mes", size: "sm" },
  { key: "ordersThisMonth", label: "Órdenes del mes", size: "sm" },
  { key: "avgTicket", label: "Ticket promedio", size: "sm" },
  { key: "completionRate", label: "Tasa completado", size: "sm" },
  { key: "overdueCount", label: "Órdenes vencidas", size: "sm" },
  { key: "ventasThisMonth", label: "Ventas del mes", size: "sm" },
  { key: "deudasPendientes", label: "Deudas pendientes", size: "sm" },
  { key: "presupuestosVigentes", label: "Presupuestos vigentes", size: "sm" },
  { key: "cajaBalance", label: "Balance de caja", size: "sm" },
  { key: "articulosStockBajo", label: "Artículos con stock bajo", size: "sm" },
  { key: "lubricentroVencimientos", label: "Vencimientos de lubricentro", size: "sm" },
  { key: "clientesNuevos", label: "Clientes nuevos este mes", size: "sm" },
  { key: "ingresosChart", label: "Ingresos últimos 6 meses", size: "lg" },
  { key: "ordenesChart", label: "Órdenes últimos 6 meses", size: "lg" },
  { key: "estadoChart", label: "Órdenes por estado", size: "lg" },
  { key: "mecanicoChart", label: "Rendimiento por mecánico", size: "lg" },
];

export const DASHBOARD_WIDGET_MAP: Record<DashboardWidgetKey, DashboardWidgetMeta> =
  Object.fromEntries(DASHBOARD_WIDGET_CATALOG.map((w) => [w.key, w])) as Record<DashboardWidgetKey, DashboardWidgetMeta>;

// Layout de siempre — se usa mientras el usuario no haya personalizado nada.
export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetKey[] = [
  "revenueThisMonth", "ordersThisMonth", "avgTicket", "completionRate", "overdueCount",
  "ingresosChart", "ordenesChart", "estadoChart", "mecanicoChart",
];

const VALID_KEYS = new Set(DASHBOARD_WIDGET_CATALOG.map((w) => w.key));

export function isDashboardWidgetKey(key: string): key is DashboardWidgetKey {
  return VALID_KEYS.has(key as DashboardWidgetKey);
}

// Descarta keys desconocidas (ej. si se sacó un widget del catálogo más adelante).
export function resolveDashboardWidgets(layout: string[] | null): DashboardWidgetKey[] {
  const keys = layout ?? DEFAULT_DASHBOARD_WIDGETS;
  return keys.filter(isDashboardWidgetKey);
}
