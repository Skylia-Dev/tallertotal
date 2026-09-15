using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MechanicsController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    [HttpGet]
    public async Task<IEnumerable<MechanicDto>> GetAll([FromQuery] bool? activeOnly)
    {
        var query = db.Mechanics
            .Where(m => m.TenantId == TenantId)
            .AsQueryable();

        if (activeOnly == true)
            query = query.Where(m => m.IsActive);

        return await query
            .OrderBy(m => m.Name)
            .Select(m => new MechanicDto(m.Id, m.Name, m.Phone, m.Specialty, m.IsActive))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MechanicDto>> GetById(Guid id)
    {
        var m = await db.Mechanics.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId);
        if (m is null) return NotFound();
        return new MechanicDto(m.Id, m.Name, m.Phone, m.Specialty, m.IsActive);
    }

    // No hay POST acá: un Mechanic siempre se crea junto con su login desde
    // UsersController.Create (Role=Mechanic), para que nunca quede sin usuario.

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MechanicDto>> Update(Guid id, CreateMechanicDto dto)
    {
        var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.Id == id && m.TenantId == TenantId);
        if (mechanic is null) return NotFound();

        mechanic.Name = dto.Name;
        mechanic.Phone = dto.Phone;
        mechanic.Specialty = dto.Specialty;
        await db.SaveChangesAsync();

        return new MechanicDto(mechanic.Id, mechanic.Name, mechanic.Phone, mechanic.Specialty, mechanic.IsActive);
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<ActionResult<MechanicDto>> Toggle(Guid id)
    {
        var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.Id == id && m.TenantId == TenantId);
        if (mechanic is null) return NotFound();

        mechanic.IsActive = !mechanic.IsActive;
        await db.SaveChangesAsync();

        return new MechanicDto(mechanic.Id, mechanic.Name, mechanic.Phone, mechanic.Specialty, mechanic.IsActive);
    }

    // No hay DELETE acá tampoco: borrar un mecánico es borrar su usuario
    // (UsersController.Delete), que en cascada borra este perfil.

    /// <summary>
    /// Stores a Web Push subscription for a mechanic.
    /// Called by the mechanic's browser after granting notification permission.
    /// No auth required — the mechanic ID in the URL is the implicit "key".
    /// </summary>
    [AllowAnonymous]
    [HttpPatch("{id:guid}/push-subscribe")]
    public async Task<IActionResult> PushSubscribe(Guid id, [FromBody] PushSubscribeDto dto)
    {
        var mechanic = await db.Mechanics.FirstOrDefaultAsync(m => m.Id == id);
        if (mechanic is null) return NotFound();

        mechanic.PushSubscriptionJson = dto.SubscriptionJson;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/public")]
    public async Task<ActionResult<MechanicPublicDto>> GetPublic(Guid id)
    {
        var m = await db.Mechanics.FirstOrDefaultAsync(x => x.Id == id);
        if (m is null) return NotFound();
        return new MechanicPublicDto(m.Id, m.Name, m.Specialty, m.PushSubscriptionJson != null);
    }
}
