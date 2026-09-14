// redeploy: force Railway to load updated env vars
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController(
    AppDbContext db, IWhatsAppService whatsApp, IWhatsAppChannelInspector whatsAppChannels, IWhatsAppChannelStore whatsAppChannelStore,
    IConfiguration config, IPushService push, IMemoryCache cache) : ControllerBase
{
    // GET /api/admin/whatsapp/status
    [HttpGet("whatsapp/status")]
    public async Task<IActionResult> WhatsAppStatus()
    {
        var status = await whatsApp.GetStatusAsync();
        return Ok(status);
    }

    // GET /api/admin/whatsapp/channels — status of BOTH channels + which one is active
    [HttpGet("whatsapp/channels")]
    public async Task<IActionResult> WhatsAppChannels()
    {
        var statuses = await whatsAppChannels.GetAllStatusesAsync();
        var active = await whatsAppChannelStore.GetAsync();
        return Ok(new
        {
            active = active.ToString(),
            channels = statuses.ToDictionary(kv => kv.Key.ToString(), kv => kv.Value)
        });
    }

    // PUT /api/admin/whatsapp/channel — switch the active channel
    [HttpPut("whatsapp/channel")]
    public async Task<IActionResult> SetWhatsAppChannel([FromBody] SetWhatsAppChannelRequest req)
    {
        if (!Enum.TryParse<WhatsAppChannel>(req.Channel, out var channel))
            return BadRequest(new { error = "Canal inválido. Usar Evolution o Meta" });

        await whatsAppChannelStore.SetAsync(channel);
        return Ok(new { active = channel.ToString() });
    }

    // GET /api/admin/whatsapp/qr
    [HttpGet("whatsapp/qr")]
    public async Task<IActionResult> WhatsAppQr()
    {
        var result = await whatsApp.GetQrAsync();
        return Ok(result);
    }

    // POST /api/admin/whatsapp/pairing-code
    [HttpPost("whatsapp/pairing-code")]
    public async Task<IActionResult> WhatsAppPairingCode([FromBody] WhatsAppTestRequest req)
    {
        var code = await whatsApp.GetPairingCodeAsync(req.Phone);
        if (code is null) return BadRequest(new { error = "No se pudo generar el código de vinculación" });
        return Ok(new { code });
    }

    // POST /api/admin/whatsapp/logout
    [HttpPost("whatsapp/logout")]
    public async Task<IActionResult> WhatsAppLogout()
    {
        var error = await whatsApp.LogoutAsync();
        if (error is null) return Ok(new { ok = true });
        return BadRequest(new { error });
    }

    // POST /api/admin/whatsapp/test
    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> WhatsAppTest([FromBody] WhatsAppTestRequest req)
    {
        var error = await whatsApp.SendTestAsync(req.Phone, req.Message ?? "🔧 TallerTotal - test de conexión WhatsApp");
        if (error is null) return Ok(new { ok = true });
        return BadRequest(new { error });
    }

    // GET /api/admin/email/status
    [HttpGet("email/status")]
    public IActionResult EmailStatus()
    {
        var apiKey = config["Resend:ApiKey"];
        var from = config["Resend:From"];
        return Ok(new
        {
            isConfigured = !string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(from),
            from
        });
    }

    // GET /api/admin/push/status
    [HttpGet("push/status")]
    public async Task<IActionResult> PushStatus()
    {
        // Check database first (keys configured via admin panel)
        var dbPublic  = await db.AppSettings.Where(s => s.Key == "Vapid:PublicKey").Select(s => s.Value).FirstOrDefaultAsync();
        var dbPrivate = await db.AppSettings.Where(s => s.Key == "Vapid:PrivateKey").Select(s => s.Value).FirstOrDefaultAsync();

        // Fall back to env vars / appsettings
        var envPublic  = config["Push:VapidPublicKey"]  ?? config["VAPID_PUBLIC_KEY"]
            ?? Environment.GetEnvironmentVariable("Push__VapidPublicKey")
            ?? Environment.GetEnvironmentVariable("VAPID_PUBLIC_KEY");
        var envPrivate = config["Push:VapidPrivateKey"] ?? config["VAPID_PRIVATE_KEY"]
            ?? Environment.GetEnvironmentVariable("Push__VapidPrivateKey")
            ?? Environment.GetEnvironmentVariable("VAPID_PRIVATE_KEY");

        var publicKey  = !string.IsNullOrWhiteSpace(dbPublic)  ? dbPublic  : envPublic;
        var privateKey = !string.IsNullOrWhiteSpace(dbPrivate) ? dbPrivate : envPrivate;
        var source     = !string.IsNullOrWhiteSpace(dbPublic)  ? "database" : "env";

        return Ok(new
        {
            isConfigured     = !string.IsNullOrWhiteSpace(publicKey) && !string.IsNullOrWhiteSpace(privateKey),
            publicKey        = publicKey,          // full public key — safe to expose (it's public)
            publicKeyPreview = string.IsNullOrWhiteSpace(publicKey) ? null : publicKey[..Math.Min(12, publicKey.Length)] + "…",
            source,
        });
    }

    // GET /api/admin/push/subscriptions — mechanics that have a push subscription (across all tenants)
    [HttpGet("push/subscriptions")]
    public async Task<IActionResult> PushSubscriptions()
    {
        var mechanics = await db.Mechanics
            .Include(m => m.Tenant)
            .Where(m => m.PushSubscriptionJson != null)
            .Select(m => new { m.Id, m.Name, tenantName = m.Tenant.Name })
            .ToListAsync();
        return Ok(mechanics);
    }

    // POST /api/admin/push/test — sends a test push to a mechanic and returns the error (if any)
    [HttpPost("push/test")]
    public async Task<IActionResult> PushTest([FromBody] PushTestRequest req)
    {
        var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.Id == req.MechanicId);
        if (mechanic is null) return NotFound(new { error = "Mecánico no encontrado" });
        if (string.IsNullOrWhiteSpace(mechanic.PushSubscriptionJson))
            return BadRequest(new { error = "El mecánico no tiene suscripción push guardada" });

        var error = await push.TestAsync(mechanic);

        // If subscription expired (410), save the cleared state
        if (mechanic.PushSubscriptionJson is null)
            await db.SaveChangesAsync();

        if (error is null) return Ok(new { ok = true });
        return Ok(new { ok = false, error });
    }

    // PUT /api/admin/push/vapid  — saves VAPID keys to the database
    [HttpPut("push/vapid")]
    public async Task<IActionResult> SetVapidKeys([FromBody] SetVapidKeysRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PublicKey) || string.IsNullOrWhiteSpace(req.PrivateKey))
            return BadRequest(new { error = "Ambas claves son requeridas" });

        await UpsertSetting("Vapid:PublicKey",  req.PublicKey.Trim());
        await UpsertSetting("Vapid:PrivateKey", req.PrivateKey.Trim());
        await db.SaveChangesAsync();

        // Invalidate the in-memory VAPID key cache so PushService picks up new keys immediately
        cache.Remove("vapid:keys");

        return Ok(new { ok = true });
    }

    private async Task UpsertSetting(string key, string value)
    {
        var setting = await db.AppSettings.FindAsync(key);
        if (setting is null)
            db.AppSettings.Add(new AppSetting { Key = key, Value = value });
        else
        {
            setting.Value     = value;
            setting.UpdatedAt = DateTime.UtcNow;
        }
    }

    // GET /api/admin/tenants
    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await db.Tenants
            .OrderBy(t => t.Name)
            .Select(t => new TenantResponse(
                t.Id, t.Name, t.IsActive, t.CreatedAt,
                t.Users.Count))
            .ToListAsync();
        return Ok(tenants);
    }

    // POST /api/admin/tenants
    [HttpPost("tenants")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest req)
    {
        var tenant = new Tenant { Id = Guid.NewGuid(), Name = req.Name };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();
        return Ok(new TenantResponse(tenant.Id, tenant.Name, tenant.IsActive, tenant.CreatedAt, 0));
    }

    // PATCH /api/admin/tenants/{id}/toggle
    [HttpPatch("tenants/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleTenant(Guid id)
    {
        var tenant = await db.Tenants.FindAsync(id);
        if (tenant is null) return NotFound();
        tenant.IsActive = !tenant.IsActive;
        await db.SaveChangesAsync();
        return Ok(new { tenant.IsActive });
    }

    // GET /api/admin/tenants/{id}/users
    [HttpGet("tenants/{id:guid}/users")]
    public async Task<IActionResult> GetUsers(Guid id)
    {
        var users = await db.Users
            .Where(u => u.TenantId == id)
            .Select(u => new UserResponse(u.Id, u.Username, u.Role.ToString(), u.CreatedAt))
            .ToListAsync();
        return Ok(users);
    }

    // POST /api/admin/tenants/{id}/users
    [HttpPost("tenants/{id:guid}/users")]
    public async Task<IActionResult> CreateUser(Guid id, [FromBody] CreateUserRequest req)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == id))
            return NotFound(new { error = "Tenant no encontrado" });

        if (await db.Users.AnyAsync(u => u.TenantId == id && u.Username == req.Username))
            return Conflict(new { error = "El usuario ya existe en este taller" });

        if (!Enum.TryParse<UserRole>(req.Role, out var role))
            return BadRequest(new { error = "Rol inválido. Usar Owner o Mechanic" });

        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = id,
            Username = req.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = role,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(new UserResponse(user.Id, user.Username, user.Role.ToString(), user.CreatedAt));
    }

    // GET /api/admin/tenants/{id}/modules
    [HttpGet("tenants/{id:guid}/modules")]
    public async Task<ActionResult<TenantModuleConfigDto>> GetTenantModules(Guid id)
    {
        if (!await db.Tenants.AnyAsync(t => t.Id == id))
            return NotFound(new { error = "Tenant no encontrado" });

        var json = await db.Tenants.Where(t => t.Id == id).Select(t => t.HiddenModulesJson).FirstOrDefaultAsync();
        return new TenantModuleConfigDto(ParseHiddenModules(json));
    }

    // PUT /api/admin/tenants/{id}/modules
    [HttpPut("tenants/{id:guid}/modules")]
    public async Task<ActionResult<TenantModuleConfigDto>> SetTenantModules(Guid id, [FromBody] UpdateTenantModuleConfigDto dto)
    {
        var tenant = await db.Tenants.FindAsync(id);
        if (tenant is null) return NotFound(new { error = "Tenant no encontrado" });

        var valid = dto.HiddenModules.Where(ModuleRegistry.HideableKeys.Contains).Distinct().ToList();
        tenant.HiddenModulesJson = valid.Count == 0 ? null : JsonSerializer.Serialize(valid);
        await db.SaveChangesAsync();

        return new TenantModuleConfigDto(valid);
    }

    private static List<string> ParseHiddenModules(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch { return []; }
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
