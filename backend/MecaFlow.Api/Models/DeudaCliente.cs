namespace TallerTotal.Api.Models;

public class DeudaCliente
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid VentaId { get; set; }
    public Venta Venta { get; set; } = null!;
    public decimal MontoOriginal { get; set; }
    public decimal MontoPagado { get; set; }
    public decimal SaldoPendiente { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Tenant Tenant { get; set; } = null!;
}
