namespace TallerTotal.Api.DTOs;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username, string TenantName, string Role);

// Devuelto en vez de LoginResponse cuando el usuario tiene 2FA habilitado.
public record LoginTwoFactorRequiredResponse(bool RequiresTwoFactor, Guid Ticket);

public record LoginTwoFactorRequest(Guid Ticket, string Code);
