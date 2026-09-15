using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Username == req.Username && u.Tenant.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Usuario o contraseña incorrectos" });

        if (user.TotpEnabled)
        {
            var ticket = new LoginTicket { UserId = user.Id, ExpiresAt = DateTime.UtcNow.AddMinutes(5) };
            db.LoginTickets.Add(ticket);
            await db.SaveChangesAsync();
            return Ok(new LoginTwoFactorRequiredResponse(true, ticket.Id));
        }

        user.LastSeenAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = GenerateToken(user.Id, user.TenantId, user.Username, user.Role.ToString());
        return Ok(new LoginResponse(token, user.Username, user.Tenant.Name, user.Role.ToString()));
    }

    [HttpPost("login/2fa")]
    public async Task<IActionResult> LoginTwoFactor([FromBody] LoginTwoFactorRequest req)
    {
        var ticket = await db.LoginTickets
            .Include(t => t.User).ThenInclude(u => u.Tenant)
            .FirstOrDefaultAsync(t => t.Id == req.Ticket);

        if (ticket is null || ticket.Used || ticket.ExpiresAt < DateTime.UtcNow)
            return Unauthorized(new { error = "El código expiró, iniciá sesión de nuevo." });

        var user = ticket.User;
        if (!user.TotpEnabled || user.TotpSecret is null || !TotpService.VerifyCode(user.TotpSecret, req.Code))
            return Unauthorized(new { error = "Código incorrecto." });

        ticket.Used = true;
        user.LastSeenAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var token = GenerateToken(user.Id, user.TenantId, user.Username, user.Role.ToString());
        return Ok(new LoginResponse(token, user.Username, user.Tenant.Name, user.Role.ToString()));
    }

    private string GenerateToken(Guid userId, Guid tenantId, string username, string role)
    {
        var secret = config["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("tenantId", tenantId.ToString()),
            new Claim("username", username),
            new Claim("role", role),
        };

        var token = new JwtSecurityToken(
            issuer: "tallertotal",
            audience: "tallertotal",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
