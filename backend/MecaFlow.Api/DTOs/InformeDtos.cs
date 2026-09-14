namespace TallerTotal.Api.DTOs;

public record VentasPorFormaPagoDto(string FormaPago, decimal Total, int Cantidad);

public record InformeResumenDto(
    decimal TotalVentas,
    int CantidadVentas,
    decimal TicketPromedio,
    decimal TotalCompras,
    int CantidadCompras,
    List<VentasPorFormaPagoDto> VentasPorFormaPago
);

public record VentaPorDiaDto(string Fecha, decimal Total, int Cantidad);

public record TopArticuloDto(string Articulo, int UnidadesVendidas, decimal TotalVendido);

public record StockBajoDto(Guid Id, string Marca, string Modelo, int Stock);
