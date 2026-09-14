using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateUserDto(
    [Required, MaxLength(60)] string Username,
    [Required, MinLength(6)] string Password,
    [Required] string Role
);

public record UserListItemDto(Guid Id, string Username, string Role, DateTime CreatedAt);
