namespace TallerTotal.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.Owner;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Secreto TOTP en Base32. Se guarda al generar el QR, pero no habilita el 2FA hasta confirmarlo con un código válido.</summary>
    public string? TotpSecret { get; set; }
    public bool TotpEnabled { get; set; }

    /// <summary>Última actividad conocida (heartbeat del frontend). Usado para el cierre de sesión por inactividad.</summary>
    public DateTime? LastSeenAt { get; set; }

    /// <summary>Foto de perfil, guardada directa en la base (no en storage externo) — igual que en CEMDI.</summary>
    public byte[]? AvatarPhoto { get; set; }
    public string? AvatarContentType { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
