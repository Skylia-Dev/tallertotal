using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record TenantSessionConfigDto(int SessionTimeoutMinutes);

public record UpdateTenantSessionConfigDto(
    [Range(1, 1440, ErrorMessage = "El tiempo de sesión debe estar entre 1 y 1440 minutos.")]
    int SessionTimeoutMinutes
);
