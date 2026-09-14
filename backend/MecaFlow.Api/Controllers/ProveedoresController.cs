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
public class ProveedoresController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    [HttpGet]
    public async Task<IEnumerable<ProveedorDto>> GetAll([FromQuery] string? search)
    {
        var query = db.Proveedores.Where(p => p.TenantId == TenantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p =>
                p.Nombre.ToLower().Contains(s) ||
                (p.Contacto != null && p.Contacto.ToLower().Contains(s)) ||
                (p.Telefono != null && p.Telefono.Contains(s)));
        }

        return await query
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorDto(p.Id, p.Nombre, p.Contacto, p.Telefono, p.Email, p.Activo, p.CreatedAt))
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ProveedorDto>> Create(CreateProveedorDto dto)
    {
        var proveedor = new Proveedor
        {
            TenantId = TenantId,
            Nombre = dto.Nombre.Trim(),
            Contacto = dto.Contacto?.Trim(),
            Telefono = dto.Telefono?.Trim(),
            Email = dto.Email?.Trim().ToLower()
        };
        db.Proveedores.Add(proveedor);
        await db.SaveChangesAsync();

        return new ProveedorDto(proveedor.Id, proveedor.Nombre, proveedor.Contacto, proveedor.Telefono, proveedor.Email, proveedor.Activo, proveedor.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProveedorDto>> Update(Guid id, CreateProveedorDto dto)
    {
        var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
        if (proveedor is null) return NotFound();

        proveedor.Nombre = dto.Nombre.Trim();
        proveedor.Contacto = dto.Contacto?.Trim();
        proveedor.Telefono = dto.Telefono?.Trim();
        proveedor.Email = dto.Email?.Trim().ToLower();
        await db.SaveChangesAsync();

        return new ProveedorDto(proveedor.Id, proveedor.Nombre, proveedor.Contacto, proveedor.Telefono, proveedor.Email, proveedor.Activo, proveedor.CreatedAt);
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
        if (proveedor is null) return NotFound();

        proveedor.Activo = !proveedor.Activo;
        await db.SaveChangesAsync();
        return Ok(new { proveedor.Id, proveedor.Activo });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == TenantId);
        if (proveedor is null) return NotFound();

        db.Proveedores.Remove(proveedor);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
