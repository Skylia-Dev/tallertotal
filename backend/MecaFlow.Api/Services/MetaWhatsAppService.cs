using TallerTotal.Api.Models;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace TallerTotal.Api.Services;

/// <summary>
/// Sends WhatsApp messages via Meta's official Cloud API (Graph API), using a
/// static long-lived access token instead of a linked/scanned session like Evolution.
///
/// IMPORTANT: Meta only allows free-form text within the 24h "customer service window"
/// (i.e. after the customer messaged first). Outside that window Meta silently accepts
/// and returns a message id, but the message is NEVER delivered — no error is raised.
/// Reliable automated notifications (order created, status changed, etc.) require
/// pre-approved message templates in the Meta Business Manager, which this service does
/// not send by default (see SendTemplateAsync). Until templates are approved for this
/// business, treat Meta as best-effort for messages sent outside that window.
/// </summary>
public class MetaWhatsAppService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<MetaWhatsAppService> logger) : IWhatsAppService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private string? PhoneNumberId => config["Meta:PhoneNumberId"];
    private string? AccessToken => config["Meta:AccessToken"];
    private string ApiVersion => config["Meta:ApiVersion"] ?? "v21.0";
    private string LanguageCode => config["Meta:LanguageCode"] ?? "es_AR";

    private bool IsConfigured => !string.IsNullOrEmpty(PhoneNumberId) && !string.IsNullOrEmpty(AccessToken);

    public Task SendOrderCreatedAsync(ServiceOrder order)
    {
        var phone = order.Vehicle.Customer.Phone;
        var name = order.Vehicle.Customer.Name.Split(' ')[0];
        var plate = order.Vehicle.LicensePlate;
        var text = $"👋 Hola *{name}*! Tu vehículo *{plate}* ingresó al taller. Te notificaremos cuando haya novedades.";
        return SendAsync(phone, text);
    }

    public Task SendStatusChangedAsync(ServiceOrder order, ServiceOrderStatus newStatus)
    {
        var phone = order.Vehicle.Customer.Phone;
        var name = order.Vehicle.Customer.Name.Split(' ')[0];
        var plate = order.Vehicle.LicensePlate;
        var vehicle = $"{order.Vehicle.Brand} {order.Vehicle.Model}";
        var mechanic = string.IsNullOrWhiteSpace(order.AssignedMechanic) ? "" : $" Mecánico: {order.AssignedMechanic}.";
        var total = order.TotalEstimate.ToString("N0");

        var text = newStatus switch
        {
            ServiceOrderStatus.InProgress => $"🔧 Hola *{name}*! Ya estamos trabajando en tu *{plate}* ({vehicle}).{mechanic}",
            ServiceOrderStatus.Completed => $"✅ ¡Listo *{name}*! Tu *{plate}* está listo para retirar. Total estimado: *${total}*.",
            ServiceOrderStatus.Cancelled => $"❌ Hola *{name}*. La orden de tu *{plate}* fue cancelada. Contactanos para más información.",
            _ => null
        };

        return text is null ? Task.CompletedTask : SendAsync(phone, text);
    }

    public Task SendQuoteAsync(ServiceOrder order)
    {
        var phone = order.Vehicle.Customer.Phone;
        var name = order.Vehicle.Customer.Name.Split(' ')[0];
        var plate = order.Vehicle.LicensePlate;
        var total = order.TotalEstimate.ToString("N0");
        var text = $"📋 Hola *{name}*! El presupuesto para tu *{plate}* es de *${total}*. Contactanos para confirmarlo y continuar.";
        return SendAsync(phone, text);
    }

    public Task SendReminderAsync(ServiceOrder order, int daysSinceActivity)
    {
        var phone = order.Vehicle.Customer.Phone;
        var name = order.Vehicle.Customer.Name.Split(' ')[0];
        var plate = order.Vehicle.LicensePlate;
        var text = $"⏰ Hola *{name}*! Tu vehículo *{plate}* lleva {daysSinceActivity} días en el taller sin novedades. Pronto te damos una actualización.";
        return SendAsync(phone, text);
    }

    public Task SendPaymentLinkAsync(ServiceOrder order, string paymentUrl)
    {
        var phone = order.Vehicle.Customer.Phone;
        var name = order.Vehicle.Customer.Name.Split(' ')[0];
        var plate = order.Vehicle.LicensePlate;
        var total = (order.TotalFinal > 0 ? order.TotalFinal : order.TotalEstimate).ToString("N0");
        var text = $"💳 Hola *{name}*! Tu *{plate}* está listo. Podés pagar online los *${total}* desde este link:\n{paymentUrl}";
        return SendAsync(phone, text);
    }

    public async Task SendAsync(string rawPhone, string text)
    {
        if (!IsConfigured)
        {
            logger.LogDebug("Meta WhatsApp not configured — skipping. PhoneNumberId={PhoneNumberId}", PhoneNumberId);
            return;
        }

        var phone = NormalizePhone(rawPhone);
        if (phone is null)
        {
            logger.LogWarning("Meta WhatsApp send skipped — could not normalize phone '{Phone}'", rawPhone);
            return;
        }

        try
        {
            var payload = JsonSerializer.Serialize(new
            {
                messaging_product = "whatsapp",
                to = phone,
                type = "text",
                text = new { body = text }
            }, JsonOpts);

            var res = await SendRawAsync(payload);
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                logger.LogWarning("Meta WhatsApp send FAILED {Status}: {Body}", res.StatusCode, body);
            else
                logger.LogInformation("Meta WhatsApp send OK {Status}: {Body} (delivery only guaranteed within the 24h customer-service window)", res.StatusCode, body);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Meta WhatsApp send exception for phone {Phone}", phone);
        }
    }

    /// <summary>
    /// Sends an approved message template. Use this for automated notifications once
    /// templates are approved in Meta Business Manager — free text (SendAsync) is NOT
    /// reliable outside the 24h customer-service window.
    /// </summary>
    public async Task<string?> SendTemplateAsync(string rawPhone, string templateName, string? headerImageUrl, params string[] bodyParams)
    {
        if (!IsConfigured) return "Meta no está configurado";

        var phone = NormalizePhone(rawPhone);
        if (phone is null) return $"No se pudo normalizar el teléfono: {rawPhone}";

        var components = new List<object>();
        if (!string.IsNullOrWhiteSpace(headerImageUrl))
            components.Add(new { type = "header", parameters = new[] { new { type = "image", image = new { link = headerImageUrl } } } });
        if (bodyParams.Length > 0)
            components.Add(new { type = "body", parameters = bodyParams.Select(p => new { type = "text", text = p }).ToArray() });

        var payload = JsonSerializer.Serialize(new
        {
            messaging_product = "whatsapp",
            to = phone,
            type = "template",
            template = new { name = templateName, language = new { code = LanguageCode }, components }
        }, JsonOpts);

        try
        {
            var res = await SendRawAsync(payload);
            var body = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode ? null : $"HTTP {(int)res.StatusCode}: {body}";
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }

    public async Task<WhatsAppStatus> GetStatusAsync()
    {
        if (!IsConfigured)
            return new WhatsAppStatus(false, null, PhoneNumberId, null, "Meta not configured (missing PhoneNumberId or AccessToken)", WhatsAppChannel.Meta, SupportsLinking: false);

        try
        {
            var client = httpFactory.CreateClient("meta-whatsapp");
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", AccessToken);

            var res = await client.GetAsync($"https://graph.facebook.com/{ApiVersion}/{PhoneNumberId}?fields=display_phone_number,verified_name");
            var body = await res.Content.ReadAsStringAsync();

            if (!res.IsSuccessStatusCode)
                return new WhatsAppStatus(true, null, PhoneNumberId, null, $"HTTP {(int)res.StatusCode}: {body}", WhatsAppChannel.Meta, SupportsLinking: false);

            var json = JsonNode.Parse(body);
            var number = json?["display_phone_number"]?.GetValue<string>();
            var verifiedName = json?["verified_name"]?.GetValue<string>();

            return new WhatsAppStatus(true, null, PhoneNumberId, "open", null, WhatsAppChannel.Meta, LinkedNumber: number is null ? null : $"{number} ({verifiedName})", SupportsLinking: false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Meta WhatsApp status check failed");
            return new WhatsAppStatus(true, null, PhoneNumberId, null, ex.Message, WhatsAppChannel.Meta, SupportsLinking: false);
        }
    }

    public async Task<string?> SendTestAsync(string phone, string message)
    {
        if (!IsConfigured) return "Not configured";
        var normalized = NormalizePhone(phone);
        if (normalized is null) return $"Could not normalize phone: {phone}";

        try
        {
            var payload = JsonSerializer.Serialize(new
            {
                messaging_product = "whatsapp",
                to = normalized,
                type = "text",
                text = new { body = message }
            }, JsonOpts);

            var res = await SendRawAsync(payload);
            var body = await res.Content.ReadAsStringAsync();
            return res.IsSuccessStatusCode
                ? null
                : $"HTTP {(int)res.StatusCode}: {body}";
        }
        catch (Exception ex)
        {
            return ex.Message;
        }
    }

    // Meta uses a static access token — there's no linked session to reconnect, QR to scan,
    // pairing code to generate, or logout to perform. These all no-op accordingly.
    public Task<bool> TryReconnectAsync() => Task.FromResult(IsConfigured);
    public Task<WhatsAppQrResult> GetQrAsync() =>
        Task.FromResult(new WhatsAppQrResult(IsConfigured, IsConfigured, null, IsConfigured ? "Meta no usa código QR — la conexión se hace con un token de acceso, no hace falta vincular un dispositivo." : "Meta no está configurado"));
    public Task<string?> GetPairingCodeAsync(string phone) => Task.FromResult<string?>(null);
    public Task<string?> LogoutAsync() => Task.FromResult<string?>("No aplica para Meta — no hay una sesión vinculada que cerrar.");

    private async Task<HttpResponseMessage> SendRawAsync(string jsonPayload)
    {
        var client = httpFactory.CreateClient("meta-whatsapp");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", AccessToken);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");
        return await client.PostAsync($"https://graph.facebook.com/{ApiVersion}/{PhoneNumberId}/messages", content);
    }

    private static string? NormalizePhone(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        if (digits.Length < 7) return null;
        if (digits.StartsWith("54") && digits.Length >= 12) return digits;
        if (digits.StartsWith("0")) digits = "54" + digits[1..];
        else digits = "54" + digits;
        return digits.Length >= 12 ? digits : null;
    }
}
