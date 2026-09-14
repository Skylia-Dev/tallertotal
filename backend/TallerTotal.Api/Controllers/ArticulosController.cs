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
public class ArticulosController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    [HttpGet]
    public async Task<IEnumerable<ArticuloDto>> GetAll([FromQuery] string? search, [FromQuery] bool? lowStock)
    {
        var query = db.Articulos.Where(a => a.TenantId == TenantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(a =>
                a.Marca.ToLower().Contains(s) ||
                a.Modelo.ToLower().Contains(s) ||
                (a.Descripcion != null && a.Descripcion.ToLower().Contains(s)));
        }

        if (lowStock == true)
            query = query.Where(a => a.Stock <= a.StockMinimo);

        return await query
            .OrderBy(a => a.Marca).ThenBy(a => a.Modelo)
            .Select(a => new ArticuloDto(a.Id, a.Marca, a.Modelo, a.Descripcion, a.Stock, a.StockMinimo, a.Precio, a.Activo, a.CreatedAt))
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ArticuloDto>> Create(CreateArticuloDto dto)
    {
        var articulo = new Articulo
        {
            TenantId = TenantId,
            Marca = dto.Marca.Trim(),
            Modelo = dto.Modelo.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Stock = dto.Stock,
            StockMinimo = dto.StockMinimo,
            Precio = dto.Precio
        };
        db.Articulos.Add(articulo);
        await db.SaveChangesAsync();

        return new ArticuloDto(articulo.Id, articulo.Marca, articulo.Modelo, articulo.Descripcion, articulo.Stock, articulo.StockMinimo, articulo.Precio, articulo.Activo, articulo.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ArticuloDto>> Update(Guid id, CreateArticuloDto dto)
    {
        var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
        if (articulo is null) return NotFound();

        articulo.Marca = dto.Marca.Trim();
        articulo.Modelo = dto.Modelo.Trim();
        articulo.Descripcion = dto.Descripcion?.Trim();
        articulo.Stock = dto.Stock;
        articulo.StockMinimo = dto.StockMinimo;
        articulo.Precio = dto.Precio;
        await db.SaveChangesAsync();

        return new ArticuloDto(articulo.Id, articulo.Marca, articulo.Modelo, articulo.Descripcion, articulo.Stock, articulo.StockMinimo, articulo.Precio, articulo.Activo, articulo.CreatedAt);
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
        if (articulo is null) return NotFound();

        articulo.Activo = !articulo.Activo;
        await db.SaveChangesAsync();
        return Ok(new { articulo.Id, articulo.Activo });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
        if (articulo is null) return NotFound();

        db.Articulos.Remove(articulo);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
