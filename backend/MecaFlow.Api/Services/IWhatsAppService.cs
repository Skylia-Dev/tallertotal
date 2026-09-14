using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

public interface IWhatsAppService
{
    Task SendOrderCreatedAsync(ServiceOrder order);
    Task SendStatusChangedAsync(ServiceOrder order, ServiceOrderStatus newStatus);
    Task SendQuoteAsync(ServiceOrder order);
    Task SendReminderAsync(ServiceOrder order, int daysSinceActivity);
    Task SendPaymentLinkAsync(ServiceOrder order, string paymentUrl);
    Task SendAsync(string phone, string text);
    Task<WhatsAppStatus> GetStatusAsync();
    Task<string?> SendTestAsync(string phone, string message);

    /// <summary>
    /// Triggers /instance/connect and waits to see if the session auto-restores.
    /// Returns true if state reached "open" without needing a QR scan.
    /// No-op (always true) for channels that don't use a linked session (e.g. Meta).
    /// </summary>
    Task<bool> TryReconnectAsync();

    /// <summary>
    /// Returns the QR code (base64 data URL) needed to reconnect a disconnected instance.
    /// Returns null if already connected or not configured. Not applicable to Meta.
    /// </summary>
    Task<WhatsAppQrResult> GetQrAsync();

    /// <summary>
    /// Returns a numeric pairing code as an alternative to scanning a QR. Not applicable to Meta.
    /// </summary>
    Task<string?> GetPairingCodeAsync(string phone);

    /// <summary>Logs out the linked device/session. Not applicable to Meta.</summary>
    Task<string?> LogoutAsync();
}

public enum WhatsAppChannel
{
    Evolution,
    Meta
}

public record WhatsAppStatus(
    bool IsConfigured,
    string? BaseUrl,
    string? Instance,
    string? ConnectionState,
    string? Error,
    WhatsAppChannel Channel,
    string? LinkedNumber = null,
    bool SupportsLinking = true
);

public record WhatsAppQrResult(
    bool IsConfigured,
    bool IsAlreadyConnected,
    string? QrBase64,
    string? Error
);

/// <summary>Lets the admin panel show both channels' status at once, regardless of which is active.</summary>
public interface IWhatsAppChannelInspector
{
    Task<Dictionary<WhatsAppChannel, WhatsAppStatus>> GetAllStatusesAsync();
}

/// <summary>Persists which WhatsApp channel (Evolution or Meta) is currently active for sending.</summary>
public interface IWhatsAppChannelStore
{
    Task<WhatsAppChannel> GetAsync();
    Task SetAsync(WhatsAppChannel channel);
}
