namespace TallerTotal.Api.Services;

/// <summary>
/// Allowlist de keys válidas para el layout del dashboard personalizable.
/// Mantener en sync con DASHBOARD_WIDGET_CATALOG en frontend/src/lib/dashboard-widgets.ts.
/// </summary>
public static class DashboardWidgetCatalog
{
    public static readonly HashSet<string> ValidKeys =
    [
        // KPIs
        "revenueThisMonth", "ordersThisMonth", "avgTicket", "completionRate", "overdueCount",
        "ventasThisMonth", "deudasPendientes", "presupuestosVigentes", "cajaBalance",
        "articulosStockBajo", "lubricentroVencimientos", "clientesNuevos",
        // Gráficos
        "ingresosChart", "ordenesChart", "estadoChart", "mecanicoChart",
    ];
}
