using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InformesController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    private static (DateTime desdeUtc, DateTime hastaUtc) Range(DateTime desde, DateTime hasta) => (
        new DateTime(desde.Year, desde.Month, desde.Day, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(hasta.Year, hasta.Month, hasta.Day, 23, 59, 59, DateTimeKind.Utc)
    );

    [HttpGet("resumen")]
    public async Task<ActionResult<InformeResumenDto>> GetResumen([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
    {
        var (desdeUtc, hastaUtc) = Range(desde, hasta);

        var ventas = await db.Ventas
            .Where(v => v.TenantId == TenantId && v.Fecha >= desdeUtc && v.Fecha <= hastaUtc)
            .ToListAsync();

        var compras = await db.Compras
            .Where(c => c.TenantId == TenantId && c.Fecha >= desdeUtc && c.Fecha <= hastaUtc)
            .ToListAsync();

        var totalVentas = ventas.Sum(v => v.Total);
        var cantidadVentas = ventas.Count;

        var ventasPorFormaPago = ventas
            .GroupBy(v => v.FormaPago.ToString())
            .Select(g => new VentasPorFormaPagoDto(g.Key, g.Sum(v => v.Total), g.Count()))
            .OrderByDescending(x => x.Total)
            .ToList();

        return new InformeResumenDto(
            totalVentas, cantidadVentas,
            cantidadVentas > 0 ? Math.Round(totalVentas / cantidadVentas, 2) : 0m,
            compras.Sum(c => c.Total), compras.Count,
            ventasPorFormaPago);
    }

    [HttpGet("ventas-por-dia")]
    public async Task<IEnumerable<VentaPorDiaDto>> GetVentasPorDia([FromQuery] DateTime desde, [FromQuery] DateTime hasta)
    {
        var (desdeUtc, hastaUtc) = Range(desde, hasta);

        var ventas = await db.Ventas
            .Where(v => v.TenantId == TenantId && v.Fecha >= desdeUtc && v.Fecha <= hastaUtc)
            .Select(v => new { v.Fecha, v.Total })
            .ToListAsync();

        return ventas
            .GroupBy(v => v.Fecha.Date)
            .Select(g => new VentaPorDiaDto(g.Key.ToString("yyyy-MM-dd"), g.Sum(v => v.Total), g.Count()))
            .OrderBy(x => x.Fecha)
            .ToList();
    }

    [HttpGet("top-articulos")]
    public async Task<IEnumerable<TopArticuloDto>> GetTopArticulos([FromQuery] DateTime desde, [FromQuery] DateTime hasta, [FromQuery] int top = 10)
    {
        var (desdeUtc, hastaUtc) = Range(desde, hasta);

        var items = await db.VentaItems
            .Where(vi => vi.Venta.TenantId == TenantId && vi.Venta.Fecha >= desdeUtc && vi.Venta.Fecha <= hastaUtc)
            .Select(vi => new { vi.ArticuloId, vi.Articulo.Marca, vi.Articulo.Modelo, vi.Cantidad, vi.Subtotal })
            .ToListAsync();

        return items
            .GroupBy(vi => new { vi.ArticuloId, vi.Marca, vi.Modelo })
            .Select(g => new TopArticuloDto(g.Key.Marca + " " + g.Key.Modelo, g.Sum(vi => vi.Cantidad), g.Sum(vi => vi.Subtotal)))
            .OrderByDescending(x => x.UnidadesVendidas)
            .Take(top)
            .ToList();
    }

    [HttpGet("stock-bajo")]
    public async Task<IEnumerable<StockBajoDto>> GetStockBajo()
    {
        return await db.Articulos
            .Where(a => a.TenantId == TenantId && a.Activo && a.Stock <= a.StockMinimo)
            .OrderBy(a => a.Stock)
            .Select(a => new StockBajoDto(a.Id, a.Marca, a.Modelo, a.Stock))
            .ToListAsync();
    }
}
