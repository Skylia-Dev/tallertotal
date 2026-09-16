using System.Text.Json;
using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Models;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

// GET /api/tenant/modules: cualquier usuario autenticado consulta qué módulos están
// ocultos para SU PROPIO rol (para filtrar su sidebar).
// GET /api/tenant/modules/all y PUT /api/tenant/modules/{role}: exclusivo del SuperAdmin,
// arman la matriz de configuración en Configuración.
[ApiController]
[Route("api/tenant/modules")]
[Authorize]
public class TenantModuleConfigController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Role => User.FindFirst("role")!.Value;

    [HttpGet]
    public async Task<ActionResult<RoleModuleConfigDto>> Get()
    {
        if (!Enum.TryParse<UserRole>(Role, out var role) || !ModuleRegistry.ConfigurableRoles.Contains(role))
            return new RoleModuleConfigDto([]);

        var json = await db.RoleModuleConfigs
            .Where(c => c.TenantId == TenantId && c.Role == role)
            .Select(c => c.HiddenModulesJson)
            .FirstOrDefaultAsync();
        return new RoleModuleConfigDto(Parse(json));
    }

    [HttpGet("all")]
    public async Task<ActionResult<Dictionary<string, List<string>>>> GetAll()
    {
        if (Role != nameof(UserRole.SuperAdmin)) return Forbid();

        var configs = await db.RoleModuleConfigs
            .Where(c => c.TenantId == TenantId)
            .ToListAsync();

        var result = new Dictionary<string, List<string>>();
        foreach (var role in ModuleRegistry.ConfigurableRoles)
        {
            var config = configs.FirstOrDefault(c => c.Role == role);
            result[role.ToString()] = Parse(config?.HiddenModulesJson);
        }
        return result;
    }

    [HttpPut("{role}")]
    public async Task<ActionResult<RoleModuleConfigDto>> Update(string role, UpdateRoleModuleConfigDto dto)
    {
        if (Role != nameof(UserRole.SuperAdmin)) return Forbid();
        if (!Enum.TryParse<UserRole>(role, out var parsedRole) || !ModuleRegistry.ConfigurableRoles.Contains(parsedRole))
            return BadRequest(new { error = "Rol inválido" });

        var valid = dto.HiddenModules.Where(ModuleRegistry.HideableKeys.Contains).Distinct().ToList();
        var json = valid.Count == 0 ? null : JsonSerializer.Serialize(valid);

        var config = await db.RoleModuleConfigs.FirstOrDefaultAsync(c => c.TenantId == TenantId && c.Role == parsedRole);
        if (config is null)
        {
            config = new RoleModuleConfig { Id = Guid.NewGuid(), TenantId = TenantId, Role = parsedRole };
            db.RoleModuleConfigs.Add(config);
        }
        config.HiddenModulesJson = json;
        await db.SaveChangesAsync();

        return new RoleModuleConfigDto(valid);
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
