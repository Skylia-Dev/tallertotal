namespace TallerTotal.Api.DTOs;

public record PresupuestoItemRequestDto(Guid ArticuloId, int Cantidad);

public record CreatePresupuestoDto(
    Guid? CustomerId,
    DateTime Vencimiento,
    string? Observacion,
    List<PresupuestoItemRequestDto> Items
);

public record PresupuestoItemDto(Guid Id, Guid ArticuloId, string ArticuloNombre, int Stock, int Cantidad, decimal PrecioUnitario, decimal Subtotal);

public record PresupuestoDto(
    Guid Id,
    DateTime Fecha,
    DateTime Vencimiento,
    Guid? CustomerId,
    string? CustomerName,
    string CreatedByUsername,
    decimal Total,
    string? Observacion,
    bool Vencido,
    List<PresupuestoItemDto> Items
);

public record PresupuestoListItemDto(
    Guid Id,
    DateTime Fecha,
    DateTime Vencimiento,
    string? CustomerName,
    int ItemsCount,
    decimal Total,
    bool Vencido
);
