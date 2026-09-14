namespace TallerTotal.Api.Services;

/// <summary>
/// The set of nav modules a tenant Owner is allowed to hide. Dashboard, Empleados and
/// Configuración are intentionally excluded so an Owner can't lock themselves out.
/// </summary>
public static class ModuleRegistry
{
    public static readonly HashSet<string> HideableKeys =
    [
        "ordenes", "clientes", "vehiculos", "mecanicos", "articulos", "proveedores",
        "compras", "ventas", "presupuestos", "deudas", "caja", "informes", "auditoria"
    ];
}
