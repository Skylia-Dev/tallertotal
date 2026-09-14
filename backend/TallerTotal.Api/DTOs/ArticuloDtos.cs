using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateArticuloDto(
    [Required, MaxLength(80)] string Marca,
    [Required, MaxLength(80)] string Modelo,
    [MaxLength(300)] string? Descripcion,
    int Stock,
    int StockMinimo,
    decimal Precio
);

public record ArticuloDto(
    Guid Id,
    string Marca,
    string Modelo,
    string? Descripcion,
    int Stock,
    int StockMinimo,
    decimal Precio,
    bool Activo,
    DateTime CreatedAt
);
