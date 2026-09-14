namespace TallerTotal.Api.Models;

public class Presupuesto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public DateTime Vencimiento { get; set; }
    public decimal Total { get; set; }
    public string? Observacion { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public ICollection<PresupuestoItem> Items { get; set; } = [];
}

public class PresupuestoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PresupuestoId { get; set; }
    public Presupuesto Presupuesto { get; set; } = null!;
    public Guid ArticuloId { get; set; }
    public Articulo Articulo { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
