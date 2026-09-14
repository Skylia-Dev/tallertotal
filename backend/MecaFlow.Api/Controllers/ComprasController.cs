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
public class ComprasController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Username => User.FindFirst("username")!.Value;

    [HttpGet]
    public async Task<IEnumerable<CompraListItemDto>> GetAll()
    {
        return await db.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Items)
            .Where(c => c.TenantId == TenantId)
            .OrderByDescending(c => c.Fecha)
            .Take(200)
            .Select(c => new CompraListItemDto(c.Id, c.Fecha, c.Proveedor.Nombre, c.Items.Count, c.Total, c.PagoInmediato, c.SaldoPendiente))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CompraDto>> GetById(Guid id)
    {
        var compra = await db.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Items).ThenInclude(i => i.Articulo)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId);
        if (compra is null) return NotFound();

        return new CompraDto(
            compra.Id, compra.Fecha, compra.ProveedorId, compra.Proveedor.Nombre, compra.CreatedByUsername,
            compra.Total, compra.PagoInmediato, compra.MontoPagado, compra.SaldoPendiente,
            compra.Items.Select(i => new CompraItemDto(i.Id, i.ArticuloId, $"{i.Articulo.Marca} {i.Articulo.Modelo}", i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CompraDto>> Create(CreateCompraDto dto)
    {
        var proveedor = await db.Proveedores.FirstOrDefaultAsync(p => p.Id == dto.ProveedorId && p.TenantId == TenantId);
        if (proveedor is null) return BadRequest("Proveedor no encontrado.");

        var items = new List<CompraItem>();
        decimal total = 0;

        await using var tx = await db.Database.BeginTransactionAsync();

        foreach (var itemReq in dto.Items)
        {
            var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == itemReq.ArticuloId && a.TenantId == TenantId);
            if (articulo is null) return BadRequest($"Artículo no encontrado.");

            var subtotal = itemReq.PrecioUnitario * itemReq.Cantidad;
            total += subtotal;

            items.Add(new CompraItem
            {
                ArticuloId = itemReq.ArticuloId,
                Cantidad = itemReq.Cantidad,
                PrecioUnitario = itemReq.PrecioUnitario,
                Subtotal = subtotal
            });

            articulo.Stock += itemReq.Cantidad;
        }

        var compra = new Compra
        {
            TenantId = TenantId,
            ProveedorId = dto.ProveedorId,
            CreatedByUsername = Username,
            Total = total,
            PagoInmediato = dto.PagoInmediato,
            MontoPagado = dto.PagoInmediato ? total : 0,
            SaldoPendiente = dto.PagoInmediato ? 0 : total,
            Items = items
        };
        db.Compras.Add(compra);
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return new CompraDto(
            compra.Id, compra.Fecha, compra.ProveedorId, proveedor.Nombre, compra.CreatedByUsername,
            compra.Total, compra.PagoInmediato, compra.MontoPagado, compra.SaldoPendiente,
            items.Select(i => new CompraItemDto(i.Id, i.ArticuloId, string.Empty, i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
    }

    [HttpPost("{id:guid}/pagar")]
    public async Task<ActionResult<CompraDto>> RegistrarPago(Guid id, [FromBody] decimal monto)
    {
        var compra = await db.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Items).ThenInclude(i => i.Articulo)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == TenantId);
        if (compra is null) return NotFound();
        if (monto <= 0 || monto > compra.SaldoPendiente) return BadRequest("Monto inválido.");

        compra.MontoPagado += monto;
        compra.SaldoPendiente -= monto;
        if (compra.SaldoPendiente == 0) compra.PagoInmediato = true;
        await db.SaveChangesAsync();

        return new CompraDto(
            compra.Id, compra.Fecha, compra.ProveedorId, compra.Proveedor.Nombre, compra.CreatedByUsername,
            compra.Total, compra.PagoInmediato, compra.MontoPagado, compra.SaldoPendiente,
            compra.Items.Select(i => new CompraItemDto(i.Id, i.ArticuloId, $"{i.Articulo.Marca} {i.Articulo.Modelo}", i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
    }
}
