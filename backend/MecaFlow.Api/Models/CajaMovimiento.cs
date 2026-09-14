namespace TallerTotal.Api.Models;

public class CajaMovimiento
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public CajaMovimientoTipo Tipo { get; set; }
    public decimal Monto { get; set; }
    public string? Observacion { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
}
