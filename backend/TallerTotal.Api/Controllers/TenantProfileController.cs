using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TallerTotal.Api.Controllers;

// Datos del taller usados en la Libreta Digital pública (nombre + teléfono de WhatsApp).
// GET: cualquier usuario autenticado. PUT: Owner o SuperAdmin.
[ApiController]
[Route("api/tenant/profile")]
[Authorize]
public class TenantProfileController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;

    [HttpGet]
    public async Task<ActionResult<TenantProfileDto>> Get()
    {
        var tenant = await db.Tenants.FindAsync(TenantId);
        if (tenant is null) return NotFound();
        return new TenantProfileDto(tenant.Name, tenant.Phone);
    }

    [HttpPut]
    public async Task<ActionResult<TenantProfileDto>> Update(UpdateTenantProfileDto dto)
    {
        if (Role != nameof(UserRole.SuperAdmin) && Role != nameof(UserRole.Owner)) return Forbid();

        var tenant = await db.Tenants.FindAsync(TenantId);
        if (tenant is null) return NotFound();

        tenant.Phone = dto.Phone;
        await db.SaveChangesAsync();

        return new TenantProfileDto(tenant.Name, tenant.Phone);
    }
}
