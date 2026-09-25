using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceOrdersController(
    AppDbContext db,
    IWhatsAppService whatsApp,
    IEmailService email,
    IPushService push,
    IMercadoPagoService mercadoPago) : ControllerBase, IActionFilter
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string CurrentUser => User.Identity?.Name ?? "unknown";
    private Guid CurrentUserId => Guid.Parse(User.FindFirst("sub")!.Value);
    private string Role => User.FindFirst("role")!.Value;

    /// <summary>
    /// Un Mechanic solo puede ver sus propias órdenes vía GetMine — el resto del panel
    /// (listado completo, edición, cambios de estado, etc.) es exclusivo del personal de oficina.
    /// </summary>
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (Role == nameof(UserRole.Mechanic) && context.ActionDescriptor.RouteValues["action"] != nameof(GetMine))
        {
            context.Result = Forbid();
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }

    private static ServiceOrderDto MapToDto(ServiceOrder o) => new(
        o.Id, o.VehicleId, o.Vehicle.LicensePlate,
        $"{o.Vehicle.Brand} {o.Vehicle.Model} {o.Vehicle.Year}",
        o.Vehicle.Customer.Name, o.Vehicle.Customer.Phone,
        o.Type, o.Status, o.DiagnosisNotes, o.MileageIn, o.AssignedMechanic,
        o.InternalNotes, o.EstimatedDeliveryAt,
        o.TotalEstimate, o.TotalFinal, o.CreatedAt, o.CompletedAt,
        o.Items.Select(i => new ServiceItemDto(i.Id, i.Description, i.Type, i.Quantity, i.UnitPrice, i.Total)).ToList(),
        o.QuoteStatus, o.LastActivityAt, o.PortalToken, o.MpPaymentLinkUrl,
        o.Type == ServiceOrderType.Lubricentro
            ? new LubricentroDetailsDto(o.OilBrand, o.OilType, o.OilLiters,
                o.ChangedOilFilter, o.ChangedAirFilter, o.ChangedCabinFilter, o.ChangedFuelFilter,
                o.NextServiceKm, o.NextServiceDate)
            : null,
        o.ChecklistItems.OrderBy(c => c.Position)
            .Select(c => new ChecklistItemDto(c.Id, c.Description, c.Checked, c.Position)).ToList()
    );

    private IQueryable<ServiceOrder> BaseQuery() =>
        db.ServiceOrders
            .Include(o => o.Vehicle).ThenInclude(v => v.Customer)
            .Include(o => o.Items)
            .Include(o => o.ChecklistItems)
            .Where(o => o.Vehicle.Customer.TenantId == TenantId);

    [HttpGet]
    public async Task<IEnumerable<ServiceOrderDto>> GetAll(
        [FromQuery] ServiceOrderStatus? status,
        [FromQuery] ServiceOrderType? type,
        [FromQuery] string? plate,
        [FromQuery] string? customer,
        [FromQuery] string? mechanic,
        [FromQuery] Guid? vehicleId,
        [FromQuery] DateOnly? dateFrom,
        [FromQuery] DateOnly? dateTo)
    {
        var query = BaseQuery().AsQueryable();
        if (status.HasValue) query = query.Where(o => o.Status == status);
        if (type.HasValue) query = query.Where(o => o.Type == type);
        if (!string.IsNullOrWhiteSpace(plate)) query = query.Where(o => o.Vehicle.LicensePlate.Contains(plate));
        if (!string.IsNullOrWhiteSpace(customer)) query = query.Where(o => o.Vehicle.Customer.Name.Contains(customer));
        if (!string.IsNullOrWhiteSpace(mechanic)) query = query.Where(o => o.AssignedMechanic != null && o.AssignedMechanic.Contains(mechanic));
        if (vehicleId.HasValue) query = query.Where(o => o.VehicleId == vehicleId);
        if (dateFrom.HasValue)
        {
            var from = dateFrom.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(o => o.CreatedAt >= from);
        }
        if (dateTo.HasValue)
        {
            var to = dateTo.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(o => o.CreatedAt < to);
        }
        // Materialise entities first so EF Core honours the .Include(o => o.Items);
        // using .Select(MapToDto) inside the query causes EF Core to ignore the Include,
        // returning empty Items collections and breaking the totalEstimate in the edit dialog.
        var entities = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return entities.Select(MapToDto);
    }

    // Todas las órdenes (activas, completadas, canceladas) asignadas al mecánico logueado.
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<ServiceOrderDto>>> GetMine()
    {
        if (Role != nameof(UserRole.Mechanic)) return Forbid();

        var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.UserId == CurrentUserId);
        if (mechanic is null) return Ok(Array.Empty<ServiceOrderDto>());

        var entities = await BaseQuery()
            .Where(o => o.AssignedMechanic == mechanic.Name)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(entities.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceOrderDto>> GetById(Guid id)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();
        return MapToDto(order);
    }

    [HttpGet("{id:guid}/logs")]
    public async Task<ActionResult<IEnumerable<ServiceOrderLogDto>>> GetLogs(Guid id)
    {
        var exists = await BaseQuery().AnyAsync(o => o.Id == id);
        if (!exists) return NotFound();

        var logs = await db.ServiceOrderLogs
            .Where(l => l.ServiceOrderId == id)
            .OrderByDescending(l => l.ChangedAt)
            .Select(l => new ServiceOrderLogDto(l.Id, l.Event, l.OldValue, l.NewValue, l.ChangedBy, l.ChangedAt))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpPost]
    public async Task<ActionResult<ServiceOrderDto>> Create(CreateServiceOrderDto dto)
    {
        if (!await db.Vehicles.AnyAsync(v => v.Id == dto.VehicleId && v.Customer.TenantId == TenantId))
            return BadRequest("Vehicle not found.");

        var order = new ServiceOrder
        {
            VehicleId = dto.VehicleId,
            Type = dto.Type,
            DiagnosisNotes = dto.DiagnosisNotes,
            MileageIn = dto.MileageIn,
            AssignedMechanic = dto.AssignedMechanic,
            InternalNotes = dto.InternalNotes,
            EstimatedDeliveryAt = dto.EstimatedDeliveryAt,
            Items = dto.Items.Select(i => new ServiceItem
            {
                Description = i.Description, Type = i.Type, Quantity = i.Quantity, UnitPrice = i.UnitPrice
            }).ToList()
        };
        order.TotalEstimate = order.Items.Sum(i => i.Quantity * i.UnitPrice);

        if (dto.Type == ServiceOrderType.Lubricentro)
        {
            var lb = dto.Lubricentro;
            order.OilBrand = lb?.OilBrand;
            order.OilType = lb?.OilType;
            order.OilLiters = lb?.OilLiters;
            order.ChangedOilFilter = lb?.ChangedOilFilter ?? false;
            order.ChangedAirFilter = lb?.ChangedAirFilter ?? false;
            order.ChangedCabinFilter = lb?.ChangedCabinFilter ?? false;
            order.ChangedFuelFilter = lb?.ChangedFuelFilter ?? false;
            // Sugerencia por defecto (editable): cada 10.000 km o 6 meses, lo que ocurra antes.
            order.NextServiceKm = lb?.NextServiceKm ?? (dto.MileageIn.HasValue ? dto.MileageIn.Value + 10_000 : null);
            order.NextServiceDate = lb?.NextServiceDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6));
        }

        var checklist = ChecklistTemplates.BuildFor(dto.Type);
        if (dto.ChecklistAnswers is { Count: > 0 })
        {
            var answers = dto.ChecklistAnswers.ToDictionary(a => a.Description, a => a.Checked);
            foreach (var item in checklist)
                if (answers.TryGetValue(item.Description, out var checkedValue))
                    item.Checked = checkedValue;
        }
        order.ChecklistItems = checklist;

        db.ServiceOrders.Add(order);
        db.ServiceOrderLogs.Add(new ServiceOrderLog
        {
            ServiceOrderId = order.Id,
            Event = "Created",
            NewValue = "Open",
            ChangedBy = CurrentUser
        });
        await db.SaveChangesAsync();

        var created = await BaseQuery().FirstAsync(o => o.Id == order.Id);

        // WhatsApp + email to customer (fire-and-forget)
        _ = whatsApp.SendOrderCreatedAsync(created);
        _ = email.SendOrderCreatedAsync(created);

        // Push notification to assigned mechanic (await so db is still alive for the query)
        if (!string.IsNullOrWhiteSpace(created.AssignedMechanic))
            await NotifyMechanicAsync(created, created.AssignedMechanic);

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, MapToDto(created));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ServiceOrderDto>> Update(Guid id, UpdateServiceOrderDto dto)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var prevMechanic = order.AssignedMechanic;

        order.Status = dto.Status;
        order.DiagnosisNotes = dto.DiagnosisNotes;
        order.MileageIn = dto.MileageIn;
        order.AssignedMechanic = dto.AssignedMechanic;
        order.InternalNotes = dto.InternalNotes;
        order.EstimatedDeliveryAt = dto.EstimatedDeliveryAt;
        order.TotalEstimate = dto.TotalEstimate;
        order.TotalFinal = dto.TotalFinal;
        order.LastActivityAt = DateTime.UtcNow;
        order.ReminderSentAt = null;

        if (order.Type == ServiceOrderType.Lubricentro && dto.Lubricentro is { } lb)
        {
            order.OilBrand = lb.OilBrand;
            order.OilType = lb.OilType;
            order.OilLiters = lb.OilLiters;
            order.ChangedOilFilter = lb.ChangedOilFilter;
            order.ChangedAirFilter = lb.ChangedAirFilter;
            order.ChangedCabinFilter = lb.ChangedCabinFilter;
            order.ChangedFuelFilter = lb.ChangedFuelFilter;
            // Si cambia el próximo vencimiento, hay que poder avisar de nuevo.
            if (lb.NextServiceKm != order.NextServiceKm || lb.NextServiceDate != order.NextServiceDate)
                order.NextServiceReminderSentAt = null;
            order.NextServiceKm = lb.NextServiceKm;
            order.NextServiceDate = lb.NextServiceDate;
        }

        if (dto.Status == ServiceOrderStatus.Completed && order.CompletedAt is null)
            order.CompletedAt = DateTime.UtcNow;

        // Delete existing items directly (avoids EF change-tracker concurrency issues)
        await db.ServiceItems.Where(i => i.ServiceOrderId == order.Id).ExecuteDeleteAsync();
        var newItems = dto.Items.Select(i => new ServiceItem
        {
            ServiceOrderId = order.Id,
            Description = i.Description ?? "",
            Type = i.Type,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice
        }).ToList();
        db.ServiceItems.AddRange(newItems);

        // Always recompute TotalEstimate from the actual items (same as Create)
        order.TotalEstimate = newItems.Sum(i => i.Quantity * i.UnitPrice);

        db.ServiceOrderLogs.Add(new ServiceOrderLog
        {
            ServiceOrderId = order.Id,
            Event = "Updated",
            ChangedBy = CurrentUser
        });

        await db.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(o => o.Id == id);

        // Push mechanic if newly assigned (await so db is still alive for the query)
        var newMechanic = updated.AssignedMechanic;
        if (!string.IsNullOrWhiteSpace(newMechanic) && newMechanic != prevMechanic)
            await NotifyMechanicAsync(updated, newMechanic);

        return MapToDto(updated);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ServiceOrderDto>> UpdateStatus(Guid id, [FromBody] ServiceOrderStatus status)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var oldStatus = order.Status.ToString();
        order.Status = status;
        order.LastActivityAt = DateTime.UtcNow;
        order.ReminderSentAt = null;

        if (status == ServiceOrderStatus.Completed && order.CompletedAt is null)
            order.CompletedAt = DateTime.UtcNow;

        db.ServiceOrderLogs.Add(new ServiceOrderLog
        {
            ServiceOrderId = order.Id,
            Event = "StatusChanged",
            OldValue = oldStatus,
            NewValue = status.ToString(),
            ChangedBy = CurrentUser
        });

        await db.SaveChangesAsync();

        _ = whatsApp.SendStatusChangedAsync(order, status);
        _ = email.SendStatusChangedAsync(order, status);
        await NotifyMechanicStatusAsync(order, status);

        return MapToDto(order);
    }

    [HttpPatch("{id:guid}/quote")]
    public async Task<ActionResult<ServiceOrderDto>> UpdateQuote(Guid id, [FromBody] QuoteStatus quoteStatus)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var oldQuote = order.QuoteStatus.ToString();
        order.QuoteStatus = quoteStatus;
        order.LastActivityAt = DateTime.UtcNow;
        order.ReminderSentAt = null;

        db.ServiceOrderLogs.Add(new ServiceOrderLog
        {
            ServiceOrderId = order.Id,
            Event = "QuoteStatusChanged",
            OldValue = oldQuote,
            NewValue = quoteStatus.ToString(),
            ChangedBy = CurrentUser
        });

        await db.SaveChangesAsync();

        if (quoteStatus == QuoteStatus.Pending)
        {
            _ = whatsApp.SendQuoteAsync(order);
            _ = email.SendQuoteAsync(order);
        }

        return MapToDto(order);
    }

    [HttpPatch("{id:guid}/checklist")]
    public async Task<ActionResult<IEnumerable<ChecklistItemDto>>> UpdateChecklist(Guid id, UpdateChecklistDto dto)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var byId = order.ChecklistItems.ToDictionary(c => c.Id);
        foreach (var answer in dto.Items)
            if (byId.TryGetValue(answer.Id, out var item))
                item.Checked = answer.Checked;

        order.LastActivityAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(order.ChecklistItems.OrderBy(c => c.Position)
            .Select(c => new ChecklistItemDto(c.Id, c.Description, c.Checked, c.Position)));
    }

    // Vehículos con un cambio de aceite (Lubricentro) próximo a vencer o ya vencido, por km y/o fecha.
    [HttpGet("lubricentro/upcoming")]
    public async Task<ActionResult<IEnumerable<UpcomingLubricentroDto>>> GetUpcomingLubricentro()
    {
        var lastLubricentroPerVehicle = await BaseQuery()
            .Where(o => o.Type == ServiceOrderType.Lubricentro
                     && o.Status == ServiceOrderStatus.Completed
                     && (o.NextServiceKm != null || o.NextServiceDate != null))
            .Select(o => new
            {
                o.Id,
                o.VehicleId,
                o.Vehicle.LicensePlate,
                o.Vehicle.PortalToken,
                VehicleDescription = o.Vehicle.Brand + " " + o.Vehicle.Model + " " + o.Vehicle.Year,
                CustomerName = o.Vehicle.Customer.Name,
                CustomerPhone = o.Vehicle.Customer.Phone,
                ServiceDate = o.CompletedAt ?? o.CreatedAt,
                o.NextServiceKm,
                o.NextServiceDate,
            })
            .ToListAsync();

        var latestMileageByVehicle = await BaseQuery()
            .Where(o => o.MileageIn != null)
            .Select(o => new { o.VehicleId, o.MileageIn, o.CreatedAt })
            .ToListAsync();
        var lastMileage = latestMileageByVehicle
            .GroupBy(o => o.VehicleId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(o => o.CreatedAt).First().MileageIn);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var result = lastLubricentroPerVehicle
            .GroupBy(o => o.VehicleId)
            .Select(g => g.OrderByDescending(o => o.ServiceDate).First())
            .Select(o =>
            {
                lastMileage.TryGetValue(o.VehicleId, out var km);
                int? kmRemaining = o.NextServiceKm.HasValue && km.HasValue ? o.NextServiceKm - km : null;
                int? daysRemaining = o.NextServiceDate.HasValue ? o.NextServiceDate.Value.DayNumber - today.DayNumber : null;

                var overdue = (daysRemaining.HasValue && daysRemaining <= 0) || (kmRemaining.HasValue && kmRemaining <= 0);
                var soon = (daysRemaining.HasValue && daysRemaining <= 30) || (kmRemaining.HasValue && kmRemaining <= 1000);
                var dueStatus = overdue ? "Vencido" : soon ? "Proximo" : "AlDia";

                return new UpcomingLubricentroDto(
                    o.VehicleId, o.LicensePlate, o.VehicleDescription, o.CustomerName, o.CustomerPhone,
                    o.Id, o.ServiceDate, o.NextServiceDate, o.NextServiceKm, km, kmRemaining, daysRemaining, dueStatus, o.PortalToken);
            })
            .OrderBy(o => o.DueStatus == "Vencido" ? 0 : o.DueStatus == "Proximo" ? 1 : 2)
            .ThenBy(o => o.DaysRemaining)
            .ToList();

        return Ok(result);
    }

    // POST /api/serviceorders/{id}/payment-link
    // Generates (or regenerates) a Mercado Pago Checkout Pro link for the order.
    [HttpPost("{id:guid}/payment-link")]
    public async Task<IActionResult> GeneratePaymentLink(Guid id)
    {
        if (!mercadoPago.IsConfigured)
            return BadRequest(new { error = "Mercado Pago no está configurado (falta MP_ACCESS_TOKEN)." });

        var order = await BaseQuery().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        try
        {
            var url = await mercadoPago.CreatePaymentLinkAsync(order);
            order.MpPaymentLinkUrl = url;
            await db.SaveChangesAsync();

            // Send payment link to customer via WhatsApp (fire-and-forget)
            _ = whatsApp.SendPaymentLinkAsync(order, url);

            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    // db query runs within the request scope; only the HTTP push is fire-and-forget
    private async Task NotifyMechanicAsync(ServiceOrder order, string mechanicName)
    {
        var mechanic = await db.Mechanics
            .FirstOrDefaultAsync(m =>
                m.TenantId == order.Vehicle.Customer.TenantId &&
                m.Name == mechanicName &&
                m.PushSubscriptionJson != null);

        if (mechanic is not null)
            _ = push.SendOrderAssignedAsync(mechanic, order);
    }

    private async Task NotifyMechanicStatusAsync(ServiceOrder order, ServiceOrderStatus newStatus)
    {
        if (string.IsNullOrWhiteSpace(order.AssignedMechanic)) return;

        var mechanic = await db.Mechanics
            .FirstOrDefaultAsync(m =>
                m.TenantId == order.Vehicle.Customer.TenantId &&
                m.Name == order.AssignedMechanic &&
                m.PushSubscriptionJson != null);

        if (mechanic is not null)
            _ = push.SendStatusChangedAsync(mechanic, order, newStatus);
    }
}
