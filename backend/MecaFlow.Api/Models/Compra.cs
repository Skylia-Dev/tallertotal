namespace TallerTotal.Api.Models;

public class Compra
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ProveedorId { get; set; }
    public Proveedor Proveedor { get; set; } = null!;
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public bool PagoInmediato { get; set; }
    public decimal MontoPagado { get; set; }
    public decimal SaldoPendiente { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public ICollection<CompraItem> Items { get; set; } = [];
}

public class CompraItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompraId { get; set; }
    public Compra Compra { get; set; } = null!;
    public Guid ArticuloId { get; set; }
    public Articulo Articulo { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
