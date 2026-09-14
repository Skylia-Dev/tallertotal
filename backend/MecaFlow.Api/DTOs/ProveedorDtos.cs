using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateProveedorDto(
    [Required, MaxLength(150)] string Nombre,
    [MaxLength(150)] string? Contacto,
    [MaxLength(30)] string? Telefono,
    [MaxLength(150), EmailAddress] string? Email
);

public record ProveedorDto(
    Guid Id,
    string Nombre,
    string? Contacto,
    string? Telefono,
    string? Email,
    bool Activo,
    DateTime CreatedAt
);
