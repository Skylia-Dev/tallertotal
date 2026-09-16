using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    private static readonly string[] SpanishMonths =
        ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    [HttpGet("metrics")]
    public async Task<DashboardMetricsDto> GetMetrics()
    {
        var now = DateTime.UtcNow;
        var startThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startLastMonth = startThisMonth.AddMonths(-1);

        var query = db.ServiceOrders
            .Include(o => o.Vehicle).ThenInclude(v => v.Customer)
            .Where(o => o.Vehicle.Customer.TenantId == TenantId);

        // Revenue: sum of TotalFinal for completed orders
        var revenueThisMonth = await query
            .Where(o => o.Status == ServiceOrderStatus.Completed && o.CompletedAt >= startThisMonth)
            .SumAsync(o => o.TotalFinal);

        var revenueLastMonth = await query
            .Where(o => o.Status == ServiceOrderStatus.Completed
                     && o.CompletedAt >= startLastMonth
                     && o.CompletedAt < startThisMonth)
            .SumAsync(o => o.TotalFinal);

        // Orders count
        var ordersThisMonth = await query.Where(o => o.CreatedAt >= startThisMonth).CountAsync();
        var ordersLastMonth = await query
            .Where(o => o.CreatedAt >= startLastMonth && o.CreatedAt < startThisMonth)
            .CountAsync();

        // Orders by status (all time for current tenant)
        var rawStatus = await query
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count(), Revenue = g.Sum(o => o.TotalFinal) })
            .ToListAsync();
        var byStatus = rawStatus
            .Select(g => new StatusCountDto(g.Status.ToString(), g.Count, g.Revenue))
            .ToList();

        // Top mechanic this month
        var topRaw = await query
            .Where(o => o.CreatedAt >= startThisMonth
                     && o.AssignedMechanic != null
                     && o.AssignedMechanic != "")
            .GroupBy(o => o.AssignedMechanic!)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .FirstOrDefaultAsync();

        var topMechanic = topRaw is null ? null : new TopMechanicDto(topRaw.Name, topRaw.Count);

        // Monthly stats: last 6 months
        var start6Months = startThisMonth.AddMonths(-5);
        var allRelevantOrders = await query
            .Where(o => o.CreatedAt >= start6Months ||
                        (o.Status == ServiceOrderStatus.Completed && o.CompletedAt >= start6Months))
            .Select(o => new
            {
                o.CreatedAt,
                o.CompletedAt,
                o.Status,
                o.TotalFinal
            })
            .ToListAsync();

        var monthlyStats = Enumerable.Range(0, 6)
            .Select(i =>
            {
                var monthStart = startThisMonth.AddMonths(-(5 - i));
                var monthEnd = monthStart.AddMonths(1);
                var label = SpanishMonths[monthStart.Month - 1];
                var orders = allRelevantOrders.Count(o => o.CreatedAt >= monthStart && o.CreatedAt < monthEnd);
                var revenue = allRelevantOrders
                    .Where(o => o.Status == ServiceOrderStatus.Completed
                             && o.CompletedAt >= monthStart
                             && o.CompletedAt < monthEnd)
                    .Sum(o => o.TotalFinal);
                return new MonthlyStatDto(label, revenue, orders);
            })
            .ToList();

        // Mechanic stats: completed orders this month grouped by mechanic
        var mechanicRaw = await query
            .Where(o => o.Status == ServiceOrderStatus.Completed
                     && o.CompletedAt >= startThisMonth
                     && o.AssignedMechanic != null
                     && o.AssignedMechanic != "")
            .GroupBy(o => o.AssignedMechanic!)
            .Select(g => new { Name = g.Key, Orders = g.Count(), Revenue = g.Sum(o => o.TotalFinal) })
            .ToListAsync();
        var mechanicStats = mechanicRaw
            .Select(m => new MechanicStatDto(m.Name, m.Orders, m.Revenue))
            .OrderByDescending(m => m.Orders)
            .ToList();

        // Average ticket: completed orders this month with TotalFinal > 0
        var completedThisMonth = await query
            .Where(o => o.Status == ServiceOrderStatus.Completed
                     && o.CompletedAt >= startThisMonth
                     && o.TotalFinal > 0)
            .Select(o => o.TotalFinal)
            .ToListAsync();
        var avgTicket = completedThisMonth.Count > 0
            ? completedThisMonth.Average()
            : 0m;

        // Overdue count: Open or InProgress with EstimatedDeliveryAt < today
        var today = DateOnly.FromDateTime(now);
        var overdueCount = await query
            .Where(o => (o.Status == ServiceOrderStatus.Open || o.Status == ServiceOrderStatus.InProgress)
                     && o.EstimatedDeliveryAt != null
                     && o.EstimatedDeliveryAt < today)
            .CountAsync();

        // Completion rate: % of orders created this month that are Completed
        var completionRate = ordersThisMonth > 0
            ? (decimal)await query
                .Where(o => o.CreatedAt >= startThisMonth && o.Status == ServiceOrderStatus.Completed)
                .CountAsync() / ordersThisMonth * 100m
            : 0m;

        // ── Widgets opcionales (catálogo del dashboard personalizable) ──────────

        var ventasThisMonth = await db.Ventas
            .Where(v => v.TenantId == TenantId && v.Fecha >= startThisMonth)
            .SumAsync(v => v.Total);

        var deudasPendientesTotal = await db.DeudasClientes
            .Where(d => d.TenantId == TenantId)
            .SumAsync(d => d.SaldoPendiente);

        var todayOnly = DateOnly.FromDateTime(now);
        var presupuestosVigentes = await db.Presupuestos
            .Where(p => p.TenantId == TenantId && p.Vencimiento >= now)
            .CountAsync();

        var cajaMovimientos = await db.CajaMovimientos
            .Where(c => c.TenantId == TenantId)
            .Select(c => new { c.Tipo, c.Monto })
            .ToListAsync();
        var cajaBalance = cajaMovimientos.Sum(c =>
            c.Tipo is CajaMovimientoTipo.Ingreso or CajaMovimientoTipo.Apertura ? c.Monto :
            c.Tipo == CajaMovimientoTipo.Retiro ? -c.Monto : 0m);

        var articulosStockBajo = await db.Articulos
            .Where(a => a.TenantId == TenantId && a.Activo && a.Stock <= a.StockMinimo)
            .CountAsync();

        var clientesNuevosEsteMes = await db.Customers
            .Where(c => c.TenantId == TenantId && c.CreatedAt >= startThisMonth)
            .CountAsync();

        // Vencimientos de Lubricentro: mismo criterio que GET /serviceorders/lubricentro/upcoming
        // (Vencido si ya pasó la fecha o el km sugerido, Próximo si falta poco de cualquiera de los dos).
        var lubricentroCandidates = await query
            .Where(o => o.Type == ServiceOrderType.Lubricentro
                     && o.Status == ServiceOrderStatus.Completed
                     && (o.NextServiceKm != null || o.NextServiceDate != null))
            .Select(o => new { o.VehicleId, o.CompletedAt, o.CreatedAt, o.NextServiceKm, o.NextServiceDate })
            .ToListAsync();
        var lastMileageByVehicle = await query
            .Where(o => o.MileageIn != null)
            .Select(o => new { o.VehicleId, o.MileageIn, o.CreatedAt })
            .ToListAsync();
        var lastMileage = lastMileageByVehicle
            .GroupBy(o => o.VehicleId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(o => o.CreatedAt).First().MileageIn);
        var lubricentroVencimientos = lubricentroCandidates
            .GroupBy(o => o.VehicleId)
            .Select(g => g.OrderByDescending(o => o.CompletedAt ?? o.CreatedAt).First())
            .Count(o =>
            {
                lastMileage.TryGetValue(o.VehicleId, out var km);
                int? kmRemaining = o.NextServiceKm.HasValue && km.HasValue ? o.NextServiceKm - km : null;
                int? daysRemaining = o.NextServiceDate.HasValue ? o.NextServiceDate.Value.DayNumber - todayOnly.DayNumber : null;
                return (daysRemaining.HasValue && daysRemaining <= 30) || (kmRemaining.HasValue && kmRemaining <= 1000);
            });

        return new DashboardMetricsDto(
            revenueThisMonth, revenueLastMonth,
            ordersThisMonth, ordersLastMonth,
            byStatus, topMechanic,
            monthlyStats, mechanicStats,
            avgTicket, overdueCount, completionRate,
            ventasThisMonth, deudasPendientesTotal, presupuestosVigentes, cajaBalance,
            articulosStockBajo, lubricentroVencimientos, clientesNuevosEsteMes);
    }
}
