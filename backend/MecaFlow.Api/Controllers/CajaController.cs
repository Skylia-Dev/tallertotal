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
public class CajaController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Username => User.FindFirst("username")!.Value;

    [HttpGet]
    public async Task<ActionResult<CajaResumenDto>> GetAll()
    {
        var query = db.CajaMovimientos.Where(m => m.TenantId == TenantId);

        var movimientos = await query
            .OrderByDescending(m => m.Fecha)
            .Take(200)
            .Select(m => new CajaMovimientoDto(m.Id, m.Fecha, m.Tipo.ToString(), m.Monto, m.Observacion, m.CreatedByUsername))
            .ToListAsync();

        var balance = await query.SumAsync(m =>
            (m.Tipo == CajaMovimientoTipo.Ingreso || m.Tipo == CajaMovimientoTipo.Apertura)
                ? m.Monto
                : m.Tipo == CajaMovimientoTipo.Retiro
                    ? -m.Monto
                    : 0m);

        return new CajaResumenDto(movimientos, balance);
    }

    [HttpPost]
    public async Task<ActionResult<CajaMovimientoDto>> Create(CreateCajaMovimientoDto dto)
    {
        if (!Enum.TryParse<CajaMovimientoTipo>(dto.Tipo, out var tipo))
            return BadRequest("Tipo de movimiento inválido.");
        if (dto.Monto <= 0) return BadRequest("El monto debe ser mayor a cero.");

        var movimiento = new CajaMovimiento
        {
            TenantId = TenantId,
            Tipo = tipo,
            Monto = dto.Monto,
            Observacion = dto.Observacion?.Trim(),
            CreatedByUsername = Username
        };
        db.CajaMovimientos.Add(movimiento);
        await db.SaveChangesAsync();

        return new CajaMovimientoDto(movimiento.Id, movimiento.Fecha, movimiento.Tipo.ToString(), movimiento.Monto, movimiento.Observacion, movimiento.CreatedByUsername);
    }
}
