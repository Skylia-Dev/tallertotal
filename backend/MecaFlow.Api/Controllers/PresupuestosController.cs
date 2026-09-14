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
public class PresupuestosController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Username => User.FindFirst("username")!.Value;

    [HttpGet]
    public async Task<IEnumerable<PresupuestoListItemDto>> GetAll()
    {
        var now = DateTime.UtcNow;
        return await db.Presupuestos
            .Include(p => p.Customer)
            .Include(p => p.Items)
            .Where(p => p.TenantId == TenantId)
            .OrderByDescending(p => p.Fecha)
            .Take(200)
            .Select(p => new PresupuestoListItemDto(p.Id, p.Fecha, p.Vencimiento, p.Customer != null ? p.Customer.Name : null, p.Items.Count, p.Total, p.Vencimiento < now))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PresupuestoDto>> GetById(Guid id)
    {
        var p = await db.Presupuestos
            .Include(x => x.Customer)
            .Include(x => x.Items).ThenInclude(i => i.Articulo)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId);
        if (p is null) return NotFound();

        return ToDto(p);
    }

    [HttpPost]
    public async Task<ActionResult<PresupuestoDto>> Create(CreatePresupuestoDto dto)
    {
        Customer? customer = null;
        if (dto.CustomerId.HasValue)
        {
            customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.TenantId == TenantId);
            if (customer is null) return BadRequest("Cliente no encontrado.");
        }

        var items = new List<PresupuestoItem>();
        decimal total = 0;

        foreach (var itemReq in dto.Items)
        {
            var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == itemReq.ArticuloId && a.TenantId == TenantId);
            if (articulo is null) return BadRequest("Artículo no encontrado.");

            var subtotal = articulo.Precio * itemReq.Cantidad;
            total += subtotal;

            items.Add(new PresupuestoItem
            {
                ArticuloId = itemReq.ArticuloId,
                Cantidad = itemReq.Cantidad,
                PrecioUnitario = articulo.Precio,
                Subtotal = subtotal
            });
        }

        var presupuesto = new Presupuesto
        {
            TenantId = TenantId,
            CustomerId = customer?.Id,
            CreatedByUsername = Username,
            Vencimiento = DateTime.SpecifyKind(dto.Vencimiento, DateTimeKind.Utc),
            Total = total,
            Observacion = dto.Observacion?.Trim(),
            Items = items
        };
        db.Presupuestos.Add(presupuesto);
        await db.SaveChangesAsync();

        presupuesto.Customer = customer;
        foreach (var item in presupuesto.Items)
            item.Articulo = await db.Articulos.FirstAsync(a => a.Id == item.ArticuloId);

        return ToDto(presupuesto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var p = await db.Presupuestos.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == TenantId);
        if (p is null) return NotFound();

        db.Presupuestos.Remove(p);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private PresupuestoDto ToDto(Presupuesto p) => new(
        p.Id, p.Fecha, p.Vencimiento, p.CustomerId, p.Customer?.Name, p.CreatedByUsername,
        p.Total, p.Observacion, p.Vencimiento < DateTime.UtcNow,
        p.Items.Select(i => new PresupuestoItemDto(i.Id, i.ArticuloId, $"{i.Articulo.Marca} {i.Articulo.Modelo}", i.Articulo.Stock, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
}
