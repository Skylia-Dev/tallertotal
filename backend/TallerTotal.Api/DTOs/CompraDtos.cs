using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CompraItemRequestDto(Guid ArticuloId, int Cantidad, decimal PrecioUnitario);

public record CreateCompraDto(
    [Required] Guid ProveedorId,
    bool PagoInmediato,
    [Required, MinLength(1)] List<CompraItemRequestDto> Items
);

public record CompraItemDto(Guid Id, Guid ArticuloId, string ArticuloNombre, int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record CompraDto(
    Guid Id,
    DateTime Fecha,
    Guid ProveedorId,
    string ProveedorNombre,
    string CreatedByUsername,
    decimal Total,
    bool PagoInmediato,
    decimal MontoPagado,
    decimal SaldoPendiente,
    List<CompraItemDto> Items
);

public record CompraListItemDto(
    Guid Id,
    DateTime Fecha,
    string ProveedorNombre,
    int ItemsCount,
    decimal Total,
    bool PagoInmediato,
    decimal SaldoPendiente
);
