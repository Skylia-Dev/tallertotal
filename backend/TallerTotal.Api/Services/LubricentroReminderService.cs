using TallerTotal.Api.Data;
using TallerTotal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Services;

/// <summary>
/// Background service that runs every hour and sends a WhatsApp reminder when a vehicle's
/// next oil change (Lubricentro order) is due within LubricentroReminderDaysBefore days, or
/// already overdue. Only date-based — km due-soon is shown in "Próximos Vencimientos" but not
/// polled automatically, since there's no live odometer feed to trigger off of.
/// </summary>
public class LubricentroReminderService(IServiceProvider sp, ILogger<LubricentroReminderService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendRemindersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Lubricentro reminder service encountered an error");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task SendRemindersAsync(CancellationToken ct)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var whatsApp = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

        var daysBefore = config.GetValue<int>("Lubricentro:ReminderDaysBefore", 7);
        var threshold = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(daysBefore));

        var due = await db.ServiceOrders
            .Include(o => o.Vehicle).ThenInclude(v => v.Customer)
            .Where(o =>
                o.Type == ServiceOrderType.Lubricentro &&
                o.Status == ServiceOrderStatus.Completed &&
                o.NextServiceDate != null &&
                o.NextServiceDate <= threshold &&
                o.NextServiceReminderSentAt == null)
            .ToListAsync(ct);

        if (due.Count == 0) return;

        logger.LogInformation("Lubricentro reminder: found {Count} vehicles due for oil change", due.Count);

        foreach (var order in due)
        {
            try
            {
                var name = order.Vehicle.Customer.Name.Split(' ')[0];
                var plate = order.Vehicle.LicensePlate;
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var daysLeft = order.NextServiceDate!.Value.DayNumber - today.DayNumber;
                var when = daysLeft <= 0 ? "ya venció" : $"vence en {daysLeft} día{(daysLeft != 1 ? "s" : "")}";
                var km = order.NextServiceKm.HasValue ? $" (o a los {order.NextServiceKm:N0} km)" : "";
                var text = $"🛢️ Hola *{name}*! El cambio de aceite de tu *{plate}* {when}{km}. Te esperamos para el service.";

                await whatsApp.SendAsync(order.Vehicle.Customer.Phone, text);
                order.NextServiceReminderSentAt = DateTime.UtcNow;
                logger.LogInformation("Lubricentro reminder sent for order {OrderId} plate={Plate}", order.Id, plate);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send lubricentro reminder for order {OrderId}", order.Id);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}
