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
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;
    private bool CanManage => Role is nameof(UserRole.Owner) or nameof(UserRole.SuperAdmin);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetAll()
    {
        if (!CanManage) return Forbid();

        return Ok(await db.Users
            .Where(u => u.TenantId == TenantId)
            .OrderBy(u => u.CreatedAt)
            .Select(u => new UserListItemDto(u.Id, u.Username, u.Role.ToString(), u.CreatedAt))
            .ToListAsync());
    }

    [HttpPost("employees")]
    public async Task<ActionResult<UserListItemDto>> CreateEmployee(CreateEmployeeDto dto)
    {
        if (!CanManage) return Forbid();

        var username = dto.Username.Trim();
        if (await db.Users.AnyAsync(u => u.TenantId == TenantId && u.Username == username))
            return BadRequest("Ya existe un usuario con ese nombre.");

        var employee = new User
        {
            TenantId = TenantId,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Employee
        };
        db.Users.Add(employee);
        await db.SaveChangesAsync();

        return new UserListItemDto(employee.Id, employee.Username, employee.Role.ToString(), employee.CreatedAt);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!CanManage) return Forbid();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == TenantId);
        if (user is null) return NotFound();
        if (user.Role == UserRole.Owner) return BadRequest("No se puede eliminar al usuario dueño.");

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
