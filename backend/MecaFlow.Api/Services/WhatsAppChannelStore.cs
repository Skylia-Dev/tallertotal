using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TallerTotal.Api.Data;
using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

/// <summary>
/// Persists the active WhatsApp channel (Evolution or Meta) in AppSettings, with a short
/// in-memory cache so every outgoing message doesn't hit the database.
/// </summary>
public class WhatsAppChannelStore(IServiceScopeFactory scopeFactory, IConfiguration config, IMemoryCache cache) : IWhatsAppChannelStore
{
    private const string SettingKey = "WhatsApp:Channel";
    private const string CacheKey = "whatsapp:channel";

    public async Task<WhatsAppChannel> GetAsync()
    {
        if (cache.TryGetValue(CacheKey, out WhatsAppChannel cached))
            return cached;

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.AppSettings.Where(s => s.Key == SettingKey).Select(s => s.Value).FirstOrDefaultAsync();

        var channel = Enum.TryParse<WhatsAppChannel>(stored, out var parsed) ? parsed : DefaultChannel();
        cache.Set(CacheKey, channel, TimeSpan.FromMinutes(1));
        return channel;
    }

    public async Task SetAsync(WhatsAppChannel channel)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var setting = await db.AppSettings.FindAsync(SettingKey);
        if (setting is null)
            db.AppSettings.Add(new AppSetting { Key = SettingKey, Value = channel.ToString() });
        else
        {
            setting.Value = channel.ToString();
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();

        cache.Set(CacheKey, channel, TimeSpan.FromMinutes(1));
    }

    // If nothing has been chosen yet, default to whichever channel actually has config present.
    private WhatsAppChannel DefaultChannel() =>
        !string.IsNullOrEmpty(config["Evolution:BaseUrl"]) ? WhatsAppChannel.Evolution : WhatsAppChannel.Meta;
}
