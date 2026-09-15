using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateUserDto(
    [Required, MaxLength(60)] string Username,
    [Required, MinLength(6)] string Password,
    [Required] string Role,
    // Solo se usan (y son requeridos) cuando Role = Mechanic: crean el perfil de mecánico enlazado.
    [MaxLength(150)] string? Name = null,
    [MaxLength(30)] string? Phone = null,
    [MaxLength(100)] string? Specialty = null
);

public record UserListItemDto(
    Guid Id, string Username, string Role, DateTime CreatedAt,
    // Solo presentes cuando Role = Mechanic: datos del perfil de mecánico enlazado.
    Guid? MechanicId = null, string? Name = null, string? Phone = null, string? Specialty = null, bool? IsActive = null
);

public record TotpStatusDto(bool Enabled);

public record TotpSetupResponseDto(string Secret, string OtpAuthUri);

public record TotpEnableDto([Required, StringLength(6, MinimumLength = 6)] string Code);

public record TotpDisableDto([Required] string Password);
