using System.Text.Json;
using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

// Read-only: cada usuario autenticado consulta qué módulos están ocultos en SU taller
// (para filtrar la sidebar). Editar esto es exclusivo del SuperAdmin — ver AdminController.
[ApiController]
[Route("api/tenant/modules")]
[Authorize]
public class TenantModuleConfigController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    [HttpGet]
    public async Task<ActionResult<TenantModuleConfigDto>> Get()
    {
        var json = await db.Tenants.Where(t => t.Id == TenantId).Select(t => t.HiddenModulesJson).FirstOrDefaultAsync();
        return new TenantModuleConfigDto(Parse(json));
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
