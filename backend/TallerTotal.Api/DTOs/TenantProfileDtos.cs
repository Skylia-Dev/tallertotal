using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record TenantProfileDto(string Name, string? Phone);

public record UpdateTenantProfileDto([MaxLength(30)] string? Phone);
