using System.Text.Json;
using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

// GET: cualquier usuario autenticado consulta qué módulos están ocultos en su taller
// (para filtrar la sidebar). PUT: exclusivo del SuperAdmin.
[ApiController]
[Route("api/tenant/modules")]
[Authorize]
public class TenantModuleConfigController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;

    [HttpGet]
    public async Task<ActionResult<TenantModuleConfigDto>> Get()
    {
        var json = await db.Tenants.Where(t => t.Id == TenantId).Select(t => t.HiddenModulesJson).FirstOrDefaultAsync();
        return new TenantModuleConfigDto(Parse(json));
    }

    [HttpPut]
    public async Task<ActionResult<TenantModuleConfigDto>> Update(UpdateTenantModuleConfigDto dto)
    {
        if (Role != nameof(UserRole.SuperAdmin)) return Forbid();

        var tenant = await db.Tenants.FindAsync(TenantId);
        if (tenant is null) return NotFound();

        var valid = dto.HiddenModules.Where(ModuleRegistry.HideableKeys.Contains).Distinct().ToList();
        tenant.HiddenModulesJson = valid.Count == 0 ? null : JsonSerializer.Serialize(valid);
        await db.SaveChangesAsync();

        return new TenantModuleConfigDto(valid);
    }

    private static List<string> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
