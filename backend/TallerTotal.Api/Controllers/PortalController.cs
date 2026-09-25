using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/portal")]
public class PortalController(AppDbContext db) : ControllerBase
{
    [HttpGet("{token:guid}")]
    public async Task<ActionResult<PortalOrderDto>> GetByToken(Guid token)
    {
        var order = await db.ServiceOrders
            .Include(o => o.Vehicle).ThenInclude(v => v.Customer)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.PortalToken == token);

        if (order is null) return NotFound();

        return new PortalOrderDto(
            order.Id,
            order.Vehicle.LicensePlate,
            $"{order.Vehicle.Brand} {order.Vehicle.Model} {order.Vehicle.Year}",
            order.Vehicle.Customer.Name,
            order.Status,
            order.QuoteStatus,
            order.DiagnosisNotes,
            order.EstimatedDeliveryAt,
            order.TotalEstimate,
            order.TotalFinal,
            order.CreatedAt,
            order.CompletedAt,
            order.Items.Select(i => new ServiceItemDto(i.Id, i.Description, i.Type, i.Quantity, i.UnitPrice, i.Total)).ToList()
        );
    }

    // Libreta Digital — historial completo de services de un vehículo, público vía token estable
    [HttpGet("vehicle/{token:guid}")]
    public async Task<ActionResult<LibretaDto>> GetVehicleLibreta(Guid token)
    {
        var vehicle = await db.Vehicles
            .Include(v => v.Customer).ThenInclude(c => c.Tenant)
            .FirstOrDefaultAsync(v => v.PortalToken == token);
        if (vehicle is null) return NotFound();

        var lubricentroOrders = await db.ServiceOrders
            .Where(o => o.VehicleId == vehicle.Id && o.Type == ServiceOrderType.Lubricentro && o.Status == ServiceOrderStatus.Completed)
            .OrderByDescending(o => o.CompletedAt ?? o.CreatedAt)
            .ToListAsync();

        var lastMileage = await db.ServiceOrders
            .Where(o => o.VehicleId == vehicle.Id && o.MileageIn != null)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => (int?)o.MileageIn)
            .FirstOrDefaultAsync();

        var latest = lubricentroOrders.FirstOrDefault(o => o.NextServiceKm != null || o.NextServiceDate != null);
        DateOnly? nextDate = latest?.NextServiceDate;
        int? nextKm = latest?.NextServiceKm;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        int? kmRemaining = nextKm.HasValue && lastMileage.HasValue ? nextKm - lastMileage : null;
        int? daysRemaining = nextDate.HasValue ? nextDate.Value.DayNumber - today.DayNumber : null;
        string? dueStatus = null;
        if (nextKm.HasValue || nextDate.HasValue)
        {
            var overdue = (daysRemaining.HasValue && daysRemaining <= 0) || (kmRemaining.HasValue && kmRemaining <= 0);
            var soon = (daysRemaining.HasValue && daysRemaining <= 30) || (kmRemaining.HasValue && kmRemaining <= 1000);
            dueStatus = overdue ? "Vencido" : soon ? "Proximo" : "AlDia";
        }

        return new LibretaDto(
            vehicle.Customer.Tenant.Name,
            vehicle.Customer.Tenant.Phone,
            vehicle.LicensePlate,
            $"{vehicle.Brand} {vehicle.Model} {vehicle.Year}",
            vehicle.Customer.Name,
            nextDate,
            nextKm,
            kmRemaining,
            daysRemaining,
            dueStatus,
            lubricentroOrders.Select(o => new LibretaEntryDto(
                o.CompletedAt ?? o.CreatedAt,
                o.MileageIn,
                o.OilBrand,
                o.OilType,
                o.OilLiters,
                o.ChangedOilFilter,
                o.ChangedAirFilter,
                o.ChangedCabinFilter,
                o.ChangedFuelFilter,
                o.DiagnosisNotes
            )).ToList()
        );
    }
}
