namespace TallerTotal.Api.Models;

public class Venta
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }
    public decimal Descuento { get; set; }
    public PaymentMethod FormaPago { get; set; }
    public decimal MontoPagado { get; set; }
    public decimal SaldoPendiente { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public ICollection<VentaItem> Items { get; set; } = [];
}

public class VentaItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public Guid ArticuloId { get; set; }
    public Articulo Articulo { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
