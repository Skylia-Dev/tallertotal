namespace TallerTotal.Api.DTOs;

public record CreateCajaMovimientoDto(string Tipo, decimal Monto, string? Observacion);

public record CajaMovimientoDto(Guid Id, DateTime Fecha, string Tipo, decimal Monto, string? Observacion, string CreatedByUsername);

public record CajaResumenDto(List<CajaMovimientoDto> Movimientos, decimal Balance);
