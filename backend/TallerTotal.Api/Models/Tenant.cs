namespace TallerTotal.Api.Models;

public class Tenant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;

    /// <summary>Teléfono de WhatsApp del taller, usado en la Libreta Digital pública (botón "Pedir turno").</summary>
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Minutos de inactividad antes de cerrar la sesión automáticamente. 0 = deshabilitado.</summary>
    public int SessionTimeoutMinutes { get; set; } = 30;

    public ICollection<User> Users { get; set; } = [];
    public ICollection<RoleModuleConfig> RoleModuleConfigs { get; set; } = [];
    public ICollection<Customer> Customers { get; set; } = [];
    public ICollection<Mechanic> Mechanics { get; set; } = [];
    public ICollection<Articulo> Articulos { get; set; } = [];
    public ICollection<Proveedor> Proveedores { get; set; } = [];
    public ICollection<Compra> Compras { get; set; } = [];
    public ICollection<Venta> Ventas { get; set; } = [];
    public ICollection<DeudaCliente> DeudasClientes { get; set; } = [];
    public ICollection<Presupuesto> Presupuestos { get; set; } = [];
    public ICollection<CajaMovimiento> CajaMovimientos { get; set; } = [];
    public ICollection<ActivityLog> ActivityLogs { get; set; } = [];
}
