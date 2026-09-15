namespace TallerTotal.Api.Models;

public class Mechanic
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = "";
    public string? Phone { get; set; }
    public string? Specialty { get; set; }
    public bool IsActive { get; set; } = true;
    public string? PushSubscriptionJson { get; set; }

    /// <summary>Login del mecánico (rol Mechanic) para que pueda entrar y ver sus órdenes. Nullable por compatibilidad con mecánicos viejos sin login.</summary>
    public Guid? UserId { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User? User { get; set; }
}
