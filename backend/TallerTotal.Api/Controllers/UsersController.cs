using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController(AppDbContext db) : ControllerBase
{
    // Roles que se pueden asignar al crear un usuario desde este panel.
    // Owner y SuperAdmin quedan afuera a propósito: no se auto-otorgan por acá.
    private static readonly HashSet<string> AssignableRoles =
        [nameof(UserRole.Admin), nameof(UserRole.Employee), nameof(UserRole.Mechanic)];

    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;
    private bool CanManage => Role is nameof(UserRole.Owner) or nameof(UserRole.SuperAdmin) or nameof(UserRole.Admin);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetAll()
    {
        if (!CanManage) return Forbid();

        var users = await db.Users
            .Where(u => u.TenantId == TenantId)
            .OrderBy(u => u.CreatedAt)
            .ToListAsync();

        var mechanicsByUserId = await db.Mechanics
            .Where(m => m.TenantId == TenantId && m.UserId != null)
            .ToDictionaryAsync(m => m.UserId!.Value);

        return Ok(users.Select(u =>
        {
            mechanicsByUserId.TryGetValue(u.Id, out var mechanic);
            return new UserListItemDto(
                u.Id, u.Username, u.Role.ToString(), u.CreatedAt,
                mechanic?.Id, mechanic?.Name, mechanic?.Phone, mechanic?.Specialty, mechanic?.IsActive);
        }));
    }

    [HttpPost]
    public async Task<ActionResult<UserListItemDto>> Create(CreateUserDto dto)
    {
        if (!CanManage) return Forbid();

        if (!AssignableRoles.Contains(dto.Role))
            return BadRequest("Rol inválido. Usar Admin, Employee o Mechanic.");

        var username = dto.Username.Trim();
        if (await db.Users.AnyAsync(u => u.TenantId == TenantId && u.Username == username))
            return BadRequest("Ya existe un usuario con ese nombre.");

        var role = Enum.Parse<UserRole>(dto.Role);
        if (role == UserRole.Mechanic && string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("El nombre es requerido para mecánicos.");

        var user = new User
        {
            TenantId = TenantId,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
        };
        db.Users.Add(user);

        // Un usuario Mechanic siempre trae su perfil de mecánico enlazado —
        // es lo que permite asignarlo a órdenes y filtrar "sus" órdenes en /mis-ordenes.
        Mechanic? mechanic = null;
        if (role == UserRole.Mechanic)
        {
            mechanic = new Mechanic
            {
                TenantId = TenantId,
                Name = dto.Name!.Trim(),
                Phone = dto.Phone,
                Specialty = dto.Specialty,
                UserId = user.Id,
            };
            db.Mechanics.Add(mechanic);
        }

        await db.SaveChangesAsync();

        return new UserListItemDto(
            user.Id, user.Username, user.Role.ToString(), user.CreatedAt,
            mechanic?.Id, mechanic?.Name, mechanic?.Phone, mechanic?.Specialty, mechanic?.IsActive);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!CanManage) return Forbid();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == TenantId);
        if (user is null) return NotFound();
        if (user.Role is UserRole.Owner or UserRole.SuperAdmin)
            return BadRequest("No se puede eliminar a este usuario.");

        if (user.Role == UserRole.Mechanic)
        {
            var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.UserId == id);
            if (mechanic is not null) db.Mechanics.Remove(mechanic);
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
