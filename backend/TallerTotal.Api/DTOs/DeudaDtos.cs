namespace TallerTotal.Api.DTOs;

public record DeudaDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid VentaId,
    decimal MontoOriginal,
    decimal MontoPagado,
    decimal SaldoPendiente,
    DateTime CreatedAt
);
