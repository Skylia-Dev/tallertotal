using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateEmployeeDto(
    [Required, MaxLength(60)] string Username,
    [Required, MinLength(6)] string Password
);

public record UserListItemDto(Guid Id, string Username, string Role, DateTime CreatedAt);
