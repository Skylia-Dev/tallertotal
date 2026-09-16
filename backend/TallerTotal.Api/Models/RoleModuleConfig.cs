namespace TallerTotal.Api.Models;

/// <summary>Qué módulos del nav están ocultos para un rol dado, dentro de un taller.
/// Un rol sin fila acá no tiene nada oculto (todo visible por defecto).</summary>
public class RoleModuleConfig
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public UserRole Role { get; set; }

    /// <summary>JSON array of module keys (see ModuleRegistry.HideableKeys). Null/empty = nada oculto.</summary>
    public string? HiddenModulesJson { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
