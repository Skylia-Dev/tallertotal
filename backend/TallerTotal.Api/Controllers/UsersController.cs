using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db) : ControllerBase
{
    // Roles que se pueden asignar al crear un usuario desde este panel.
    // Owner y SuperAdmin quedan afuera a propósito: no se auto-otorgan por acá.
    private static readonly HashSet<string> AssignableRoles =
        [nameof(UserRole.Admin), nameof(UserRole.Employee), nameof(UserRole.Mechanic)];

    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private Guid CurrentUserId => Guid.Parse(User.FindFirst("sub")!.Value);
    private string Username => User.FindFirst("username")!.Value;
    private string Role => User.FindFirst("role")!.Value;
    private bool CanManage => Role is nameof(UserRole.Owner) or nameof(UserRole.SuperAdmin) or nameof(UserRole.Admin);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetAll()
    {
        if (!CanManage) return Forbid();

        // Proyección explícita: nunca traer PasswordHash/TotpSecret/AvatarPhoto a memoria para un listado.
        var users = await db.Users
            .Where(u => u.TenantId == TenantId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new { u.Id, u.Username, u.Role, u.CreatedAt })
            .ToListAsync();

        var mechanicsByUserId = await db.Mechanics
            .Where(m => m.TenantId == TenantId && m.UserId != null)
            .ToDictionaryAsync(m => m.UserId!.Value);

        return Ok(users.Select(u =>
        {
            mechanicsByUserId.TryGetValue(u.Id, out var mechanic);
            return new UserListItemDto(
                u.Id, u.Username, u.Role.ToString(), u.CreatedAt,
                mechanic?.Id, mechanic?.Name, mechanic?.Phone, mechanic?.Specialty, mechanic?.IsActive);
        }));
    }

    [HttpPost]
    public async Task<ActionResult<UserListItemDto>> Create(CreateUserDto dto)
    {
        if (!CanManage) return Forbid();

        if (!AssignableRoles.Contains(dto.Role))
            return BadRequest("Rol inválido. Usar Admin, Employee o Mechanic.");

        var username = dto.Username.Trim();
        if (await db.Users.AnyAsync(u => u.TenantId == TenantId && u.Username == username))
            return BadRequest("Ya existe un usuario con ese nombre.");

        var role = Enum.Parse<UserRole>(dto.Role);
        if (role == UserRole.Mechanic && string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("El nombre es requerido para mecánicos.");

        var user = new User
        {
            TenantId = TenantId,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
        };
        db.Users.Add(user);

        // Un usuario Mechanic siempre trae su perfil de mecánico enlazado —
        // es lo que permite asignarlo a órdenes y filtrar "sus" órdenes en /mis-ordenes.
        Mechanic? mechanic = null;
        if (role == UserRole.Mechanic)
        {
            mechanic = new Mechanic
            {
                TenantId = TenantId,
                Name = dto.Name!.Trim(),
                Phone = dto.Phone,
                Specialty = dto.Specialty,
                UserId = user.Id,
            };
            db.Mechanics.Add(mechanic);
        }

        await db.SaveChangesAsync();

        return new UserListItemDto(
            user.Id, user.Username, user.Role.ToString(), user.CreatedAt,
            mechanic?.Id, mechanic?.Name, mechanic?.Phone, mechanic?.Specialty, mechanic?.IsActive);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!CanManage) return Forbid();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == TenantId);
        if (user is null) return NotFound();
        if (user.Role is UserRole.Owner or UserRole.SuperAdmin)
            return BadRequest("No se puede eliminar a este usuario.");

        if (user.Role == UserRole.Mechanic)
        {
            var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.UserId == id);
            if (mechanic is not null) db.Mechanics.Remove(mechanic);
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Heartbeat de actividad — lo llama el tracker del frontend mientras hay uso real
    // de la página. Alimenta el cierre de sesión por inactividad (ver InactivitySessionMiddleware).
    [HttpPut("me/activity")]
    public async Task<IActionResult> PingActivity()
    {
        await db.Users.Where(u => u.Id == CurrentUserId).ExecuteUpdateAsync(s => s.SetProperty(u => u.LastSeenAt, DateTime.UtcNow));
        return NoContent();
    }

    // ── Contraseña propia ────────────────────────────────────────────────────

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest("La contraseña actual no es correcta.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── Foto de perfil ───────────────────────────────────────────────────────
    // Se guarda directo en la base (bytea), igual que en CEMDI — sin depender
    // de que el taller tenga Supabase Storage configurado (eso es opcional, para Agenda).

    private const long MaxAvatarBytes = 5 * 1024 * 1024;

    [HttpPost("me/avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile foto)
    {
        if (foto.Length == 0) return BadRequest("Archivo vacío.");
        if (foto.Length > MaxAvatarBytes) return BadRequest("La imagen no puede superar 5MB.");
        if (!foto.ContentType.StartsWith("image/")) return BadRequest("El archivo debe ser una imagen.");

        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        using var ms = new MemoryStream();
        await foto.CopyToAsync(ms);
        user.AvatarPhoto = ms.ToArray();
        user.AvatarContentType = foto.ContentType;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("me/avatar")]
    public async Task<IActionResult> GetMyAvatar()
    {
        var user = await db.Users.Where(u => u.Id == CurrentUserId)
            .Select(u => new { u.AvatarPhoto, u.AvatarContentType }).FirstAsync();
        if (user.AvatarPhoto is null) return NotFound();
        return File(user.AvatarPhoto, user.AvatarContentType ?? "image/jpeg");
    }

    [HttpGet("{id:guid}/avatar")]
    public async Task<IActionResult> GetAvatar(Guid id)
    {
        var user = await db.Users.Where(u => u.Id == id && u.TenantId == TenantId)
            .Select(u => new { u.AvatarPhoto, u.AvatarContentType }).FirstOrDefaultAsync();
        if (user?.AvatarPhoto is null) return NotFound();
        return File(user.AvatarPhoto, user.AvatarContentType ?? "image/jpeg");
    }

    // ── Autenticación de dos factores (TOTP) ────────────────────────────────
    // Cada usuario gestiona la suya propia — no requiere CanManage.

    [HttpGet("me/2fa")]
    public async Task<ActionResult<TotpStatusDto>> GetTwoFactorStatus()
    {
        var enabled = await db.Users.Where(u => u.Id == CurrentUserId).Select(u => u.TotpEnabled).FirstAsync();
        return new TotpStatusDto(enabled);
    }

    [HttpPost("me/2fa/setup")]
    public async Task<ActionResult<TotpSetupResponseDto>> SetupTwoFactor()
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        if (user.TotpEnabled) return BadRequest("El 2FA ya está habilitado. Desactivalo antes de generar un nuevo código.");

        var secret = TotpService.GenerateSecret();
        user.TotpSecret = secret;
        await db.SaveChangesAsync();

        return new TotpSetupResponseDto(secret, TotpService.BuildOtpAuthUri(secret, Username));
    }

    [HttpPost("me/2fa/enable")]
    public async Task<IActionResult> EnableTwoFactor(TotpEnableDto dto)
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        if (user.TotpSecret is null) return BadRequest("Primero generá el código QR.");
        if (!TotpService.VerifyCode(user.TotpSecret, dto.Code)) return BadRequest("Código incorrecto.");

        user.TotpEnabled = true;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("me/2fa/disable")]
    public async Task<IActionResult> DisableTwoFactor(TotpDisableDto dto)
    {
        var user = await db.Users.FirstAsync(u => u.Id == CurrentUserId);
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return BadRequest("Contraseña incorrecta.");

        user.TotpEnabled = false;
        user.TotpSecret = null;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
