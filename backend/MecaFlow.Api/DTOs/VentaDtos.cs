namespace TallerTotal.Api.DTOs;

public record VentaItemRequestDto(Guid ArticuloId, int Cantidad, decimal PrecioUnitario);

public record CreateVentaDto(
    Guid? CustomerId,
    decimal Descuento,
    string FormaPago,
    List<VentaItemRequestDto> Items
);

public record VentaItemDto(Guid Id, Guid ArticuloId, string ArticuloNombre, int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record VentaDto(
    Guid Id,
    DateTime Fecha,
    Guid? CustomerId,
    string? CustomerName,
    string CreatedByUsername,
    decimal Total,
    decimal Descuento,
    string FormaPago,
    decimal MontoPagado,
    decimal SaldoPendiente,
    List<VentaItemDto> Items
);

public record VentaListItemDto(
    Guid Id,
    DateTime Fecha,
    string? CustomerName,
    int ItemsCount,
    decimal Total,
    string FormaPago
);
