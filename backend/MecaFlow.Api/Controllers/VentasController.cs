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
public class VentasController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Username => User.FindFirst("username")!.Value;

    [HttpGet]
    public async Task<IEnumerable<VentaListItemDto>> GetAll()
    {
        return await db.Ventas
            .Include(v => v.Customer)
            .Include(v => v.Items)
            .Where(v => v.TenantId == TenantId)
            .OrderByDescending(v => v.Fecha)
            .Take(200)
            .Select(v => new VentaListItemDto(v.Id, v.Fecha, v.Customer != null ? v.Customer.Name : null, v.Items.Count, v.Total, v.FormaPago.ToString()))
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<VentaDto>> GetById(Guid id)
    {
        var venta = await db.Ventas
            .Include(v => v.Customer)
            .Include(v => v.Items).ThenInclude(i => i.Articulo)
            .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == TenantId);
        if (venta is null) return NotFound();

        return ToDto(venta);
    }

    [HttpPost]
    public async Task<ActionResult<VentaDto>> Create(CreateVentaDto dto)
    {
        if (!Enum.TryParse<PaymentMethod>(dto.FormaPago, out var formaPago))
            return BadRequest("Forma de pago inválida.");

        Customer? customer = null;
        if (dto.CustomerId.HasValue)
        {
            customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.TenantId == TenantId);
            if (customer is null) return BadRequest("Cliente no encontrado.");
        }
        if (formaPago == PaymentMethod.Deuda && customer is null)
            return BadRequest("Para vender a cuenta corriente hay que seleccionar un cliente.");

        var items = new List<VentaItem>();
        decimal total = 0;

        foreach (var itemReq in dto.Items)
        {
            var articulo = await db.Articulos.FirstOrDefaultAsync(a => a.Id == itemReq.ArticuloId && a.TenantId == TenantId);
            if (articulo is null) return BadRequest("Artículo no encontrado.");
            if (articulo.Stock < itemReq.Cantidad) return BadRequest($"Stock insuficiente de \"{articulo.Marca} {articulo.Modelo}\".");

            var subtotal = itemReq.PrecioUnitario * itemReq.Cantidad;
            total += subtotal;

            items.Add(new VentaItem
            {
                ArticuloId = itemReq.ArticuloId,
                Cantidad = itemReq.Cantidad,
                PrecioUnitario = itemReq.PrecioUnitario,
                Subtotal = subtotal
            });

            articulo.Stock -= itemReq.Cantidad;
        }

        total -= dto.Descuento;
        if (total < 0) total = 0;

        var venta = new Venta
        {
            TenantId = TenantId,
            CustomerId = customer?.Id,
            CreatedByUsername = Username,
            Total = total,
            Descuento = dto.Descuento,
            FormaPago = formaPago,
            MontoPagado = formaPago == PaymentMethod.Deuda ? 0 : total,
            SaldoPendiente = formaPago == PaymentMethod.Deuda ? total : 0,
            Items = items
        };
        db.Ventas.Add(venta);

        if (formaPago == PaymentMethod.Deuda)
        {
            db.DeudasClientes.Add(new DeudaCliente
            {
                TenantId = TenantId,
                CustomerId = customer!.Id,
                VentaId = venta.Id,
                MontoOriginal = total,
                MontoPagado = 0,
                SaldoPendiente = total
            });
        }

        await db.SaveChangesAsync();

        venta.Customer = customer;
        foreach (var item in venta.Items)
            item.Articulo = await db.Articulos.FirstAsync(a => a.Id == item.ArticuloId);

        return ToDto(venta);
    }

    private static VentaDto ToDto(Venta venta) => new(
        venta.Id, venta.Fecha, venta.CustomerId, venta.Customer?.Name, venta.CreatedByUsername,
        venta.Total, venta.Descuento, venta.FormaPago.ToString(), venta.MontoPagado, venta.SaldoPendiente,
        venta.Items.Select(i => new VentaItemDto(i.Id, i.ArticuloId, $"{i.Articulo.Marca} {i.Articulo.Modelo}", i.Cantidad, i.PrecioUnitario, i.Subtotal)).ToList());
}
