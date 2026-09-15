namespace TallerTotal.Api.Models;

public enum ServiceOrderStatus
{
    Open,
    InProgress,
    Completed,
    Cancelled
}

public enum ServiceItemType
{
    Labor,
    Part
}

/// <summary>Extensible: cada tipo nuevo de servicio que ofrezca un taller (gomería, chapa y pintura, etc.) se agrega acá.</summary>
public enum ServiceOrderType
{
    General,
    Lubricentro
}

public enum UserRole
{
    Owner,
    Mechanic,
    Employee,
    SuperAdmin,
    Admin
}

public enum QuoteStatus
{
    None,
    Pending,
    Approved,
    Rejected
}

public enum PaymentMethod
{
    Contado,
    Tarjeta,
    Transferencia,
    Deuda
}

public enum CajaMovimientoTipo
{
    Apertura,
    Cierre,
    Arqueo,
    Retiro,
    Ingreso
}
