using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

/// <summary>
/// The IWhatsAppService actually injected app-wide. Picks Evolution or Meta per-call based
/// on IWhatsAppChannelStore, so the active channel can be switched from the admin panel
/// without redeploying.
/// </summary>
public class WhatsAppServiceRouter(
    EvolutionWhatsAppService evolution,
    MetaWhatsAppService meta,
    IWhatsAppChannelStore channelStore) : IWhatsAppService, IWhatsAppChannelInspector
{
    private async Task<IWhatsAppService> ActiveAsync() =>
        await channelStore.GetAsync() == WhatsAppChannel.Meta ? meta : evolution;

    public async Task SendOrderCreatedAsync(ServiceOrder order) => await (await ActiveAsync()).SendOrderCreatedAsync(order);
    public async Task SendStatusChangedAsync(ServiceOrder order, ServiceOrderStatus newStatus) => await (await ActiveAsync()).SendStatusChangedAsync(order, newStatus);
    public async Task SendQuoteAsync(ServiceOrder order) => await (await ActiveAsync()).SendQuoteAsync(order);
    public async Task SendReminderAsync(ServiceOrder order, int daysSinceActivity) => await (await ActiveAsync()).SendReminderAsync(order, daysSinceActivity);
    public async Task SendPaymentLinkAsync(ServiceOrder order, string paymentUrl) => await (await ActiveAsync()).SendPaymentLinkAsync(order, paymentUrl);
    public async Task SendAsync(string phone, string text) => await (await ActiveAsync()).SendAsync(phone, text);
    public async Task<WhatsAppStatus> GetStatusAsync() => await (await ActiveAsync()).GetStatusAsync();
    public async Task<string?> SendTestAsync(string phone, string message) => await (await ActiveAsync()).SendTestAsync(phone, message);
    public async Task<bool> TryReconnectAsync() => await (await ActiveAsync()).TryReconnectAsync();
    public async Task<WhatsAppQrResult> GetQrAsync() => await (await ActiveAsync()).GetQrAsync();
    public async Task<string?> GetPairingCodeAsync(string phone) => await (await ActiveAsync()).GetPairingCodeAsync(phone);
    public async Task<string?> LogoutAsync() => await (await ActiveAsync()).LogoutAsync();

    public async Task<Dictionary<WhatsAppChannel, WhatsAppStatus>> GetAllStatusesAsync()
    {
        var evolutionStatus = await evolution.GetStatusAsync();
        var metaStatus = await meta.GetStatusAsync();
        return new Dictionary<WhatsAppChannel, WhatsAppStatus>
        {
            [WhatsAppChannel.Evolution] = evolutionStatus,
            [WhatsAppChannel.Meta] = metaStatus
        };
    }
}
