using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

/// <summary>
/// The set of nav modules that can be hidden per role. Dashboard, Usuarios y
/// Configuración quedan afuera para que ningún rol configurable pierda acceso a lo básico.
/// </summary>
public static class ModuleRegistry
{
    public static readonly HashSet<string> HideableKeys =
    [
        "ordenes", "clientes", "vehiculos", "articulos", "proveedores",
        "compras", "ventas", "presupuestos", "deudas", "caja", "informes", "auditoria"
    ];

    /// <summary>Roles con menú configurable vía RoleModuleConfig. Mechanic queda afuera:
    /// ya tiene su propio menú fijo y reducido (Dashboard + Mis Órdenes), no basado en estas keys.</summary>
    public static readonly HashSet<UserRole> ConfigurableRoles =
    [
        UserRole.Owner, UserRole.SuperAdmin, UserRole.Admin, UserRole.Employee
    ];
}
