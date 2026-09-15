using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

// GET: cualquier usuario autenticado (lo necesita el tracker de actividad del frontend).
// PUT: exclusivo del SuperAdmin.
[ApiController]
[Route("api/tenant/session-config")]
[Authorize]
public class TenantSessionConfigController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;

    [HttpGet]
    public async Task<ActionResult<TenantSessionConfigDto>> Get()
    {
        var minutes = await db.Tenants.Where(t => t.Id == TenantId).Select(t => t.SessionTimeoutMinutes).FirstOrDefaultAsync();
        return new TenantSessionConfigDto(minutes);
    }

    [HttpPut]
    public async Task<ActionResult<TenantSessionConfigDto>> Update(UpdateTenantSessionConfigDto dto)
    {
        if (Role != nameof(UserRole.SuperAdmin)) return Forbid();

        var tenant = await db.Tenants.FindAsync(TenantId);
        if (tenant is null) return NotFound();

        tenant.SessionTimeoutMinutes = dto.SessionTimeoutMinutes;
        await db.SaveChangesAsync();

        return new TenantSessionConfigDto(tenant.SessionTimeoutMinutes);
    }
}
