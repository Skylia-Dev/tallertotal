namespace TallerTotal.Api.Models;

public class Vehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? Notes { get; set; }

    /// <summary>Token público estable para la Libreta Digital (historial de services del vehículo, sin login).</summary>
    public Guid PortalToken { get; set; } = Guid.NewGuid();

    public Customer Customer { get; set; } = null!;
    public ICollection<ServiceOrder> ServiceOrders { get; set; } = [];
}
