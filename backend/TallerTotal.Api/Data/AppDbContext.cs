using TallerTotal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<ServiceOrder> ServiceOrders => Set<ServiceOrder>();
    public DbSet<ServiceItem> ServiceItems => Set<ServiceItem>();
    public DbSet<ServiceOrderLog> ServiceOrderLogs => Set<ServiceOrderLog>();
    public DbSet<ServiceOrderChecklistItem> ServiceOrderChecklistItems => Set<ServiceOrderChecklistItem>();
    public DbSet<Mechanic> Mechanics => Set<Mechanic>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();
    public DbSet<ServiceDocument> ServiceDocuments => Set<ServiceDocument>();
    public DbSet<ServiceScheduleEntry> ServiceScheduleEntries => Set<ServiceScheduleEntry>();
    public DbSet<Articulo> Articulos => Set<Articulo>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<CompraItem> CompraItems => Set<CompraItem>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<VentaItem> VentaItems => Set<VentaItem>();
    public DbSet<DeudaCliente> DeudasClientes => Set<DeudaCliente>();
    public DbSet<Presupuesto> Presupuestos => Set<Presupuesto>();
    public DbSet<PresupuestoItem> PresupuestoItems => Set<PresupuestoItem>();
    public DbSet<CajaMovimiento> CajaMovimientos => Set<CajaMovimiento>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<LoginTicket> LoginTickets => Set<LoginTicket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.HiddenModulesJson).HasMaxLength(2000);
        });

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).HasMaxLength(60).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).HasConversion<string>();
            e.Property(x => x.TotpSecret).HasMaxLength(160);
            e.HasIndex(x => new { x.TenantId, x.Username }).IsUnique();
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LoginTicket>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Customer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            e.Property(x => x.Email).HasMaxLength(150);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Customers)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Vehicle>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.LicensePlate).HasMaxLength(20).IsRequired();
            e.Property(x => x.Brand).HasMaxLength(60).IsRequired();
            e.Property(x => x.Model).HasMaxLength(60).IsRequired();
            e.Property(x => x.Color).HasMaxLength(40);
            e.HasIndex(x => x.LicensePlate);
            e.HasOne(x => x.Customer)
                .WithMany(x => x.Vehicles)
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceOrder>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasDefaultValue(ServiceOrderType.General);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.QuoteStatus).HasConversion<string>().HasDefaultValue(QuoteStatus.None);
            e.Property(x => x.TotalEstimate).HasPrecision(10, 2);
            e.Property(x => x.TotalFinal).HasPrecision(10, 2);
            e.Property(x => x.AssignedMechanic).HasMaxLength(100);
            e.Property(x => x.InternalNotes).HasMaxLength(1000);
            e.Property(x => x.OilBrand).HasMaxLength(60);
            e.Property(x => x.OilType).HasMaxLength(40);
            e.Property(x => x.OilLiters).HasPrecision(5, 2);
            e.HasOne(x => x.Vehicle)
                .WithMany(x => x.ServiceOrders)
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceOrderChecklistItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Description).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.ServiceOrder)
                .WithMany(x => x.ChecklistItems)
                .HasForeignKey(x => x.ServiceOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceOrderLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Event).HasMaxLength(50).IsRequired();
            e.Property(x => x.OldValue).HasMaxLength(100);
            e.Property(x => x.NewValue).HasMaxLength(100);
            e.Property(x => x.ChangedBy).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.ServiceOrder)
                .WithMany(x => x.Logs)
                .HasForeignKey(x => x.ServiceOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Mechanic>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.Specialty).HasMaxLength(100);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Mechanics)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AppSetting>(e =>
        {
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasMaxLength(100).IsRequired();
            e.Property(x => x.Value).HasMaxLength(2000).IsRequired();
        });

        modelBuilder.Entity<ServiceDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FileName).HasMaxLength(300).IsRequired();
            e.Property(x => x.StorageUrl).HasMaxLength(1000).IsRequired();
            e.Property(x => x.VehicleLicensePlate).HasMaxLength(20);
            e.Property(x => x.VehicleDescription).HasMaxLength(200);
            e.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceScheduleEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ServiceType).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.Document)
                .WithMany(x => x.Entries)
                .HasForeignKey(x => x.ServiceDocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServiceItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Description).HasMaxLength(200).IsRequired();
            e.Property(x => x.Type).HasConversion<string>();
            e.Property(x => x.Quantity).HasPrecision(10, 2);
            e.Property(x => x.UnitPrice).HasPrecision(10, 2);
            e.Ignore(x => x.Total);
            e.HasOne(x => x.ServiceOrder)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.ServiceOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Articulo>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Marca).HasMaxLength(80).IsRequired();
            e.Property(x => x.Modelo).HasMaxLength(80).IsRequired();
            e.Property(x => x.Descripcion).HasMaxLength(300);
            e.Property(x => x.Precio).HasPrecision(10, 2);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Articulos)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Proveedor>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Nombre).HasMaxLength(150).IsRequired();
            e.Property(x => x.Contacto).HasMaxLength(150);
            e.Property(x => x.Telefono).HasMaxLength(30);
            e.Property(x => x.Email).HasMaxLength(150);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Proveedores)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Compra>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CreatedByUsername).HasMaxLength(60).IsRequired();
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.MontoPagado).HasPrecision(10, 2);
            e.Property(x => x.SaldoPendiente).HasPrecision(10, 2);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Compras)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Proveedor)
                .WithMany()
                .HasForeignKey(x => x.ProveedorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CompraItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PrecioUnitario).HasPrecision(10, 2);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.HasOne(x => x.Compra)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.CompraId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Articulo)
                .WithMany()
                .HasForeignKey(x => x.ArticuloId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Venta>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CreatedByUsername).HasMaxLength(60).IsRequired();
            e.Property(x => x.FormaPago).HasConversion<string>();
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.Descuento).HasPrecision(10, 2);
            e.Property(x => x.MontoPagado).HasPrecision(10, 2);
            e.Property(x => x.SaldoPendiente).HasPrecision(10, 2);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Ventas)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VentaItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PrecioUnitario).HasPrecision(10, 2);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.HasOne(x => x.Venta)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.VentaId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Articulo)
                .WithMany()
                .HasForeignKey(x => x.ArticuloId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DeudaCliente>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.MontoOriginal).HasPrecision(10, 2);
            e.Property(x => x.MontoPagado).HasPrecision(10, 2);
            e.Property(x => x.SaldoPendiente).HasPrecision(10, 2);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.DeudasClientes)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Venta)
                .WithMany()
                .HasForeignKey(x => x.VentaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Presupuesto>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CreatedByUsername).HasMaxLength(60).IsRequired();
            e.Property(x => x.Total).HasPrecision(10, 2);
            e.Property(x => x.Observacion).HasMaxLength(500);
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.Presupuestos)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Customer)
                .WithMany()
                .HasForeignKey(x => x.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PresupuestoItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PrecioUnitario).HasPrecision(10, 2);
            e.Property(x => x.Subtotal).HasPrecision(10, 2);
            e.HasOne(x => x.Presupuesto)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.PresupuestoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Articulo)
                .WithMany()
                .HasForeignKey(x => x.ArticuloId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CajaMovimiento>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Tipo).HasConversion<string>();
            e.Property(x => x.Monto).HasPrecision(10, 2);
            e.Property(x => x.Observacion).HasMaxLength(300);
            e.Property(x => x.CreatedByUsername).HasMaxLength(60).IsRequired();
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.CajaMovimientos)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).HasMaxLength(60).IsRequired();
            e.Property(x => x.Action).HasMaxLength(60).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Tenant)
                .WithMany(x => x.ActivityLogs)
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
