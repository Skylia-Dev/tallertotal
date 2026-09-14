using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using TallerTotal.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeudasController(AppDbContext db, ActivityLogger logger) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);
    private string Username => User.FindFirst("username")!.Value;

    [HttpGet]
    public async Task<IEnumerable<DeudaDto>> GetAll([FromQuery] bool? onlyPending)
    {
        var query = db.DeudasClientes.Include(d => d.Customer).Where(d => d.TenantId == TenantId);
        if (onlyPending == true)
            query = query.Where(d => d.SaldoPendiente > 0);

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DeudaDto(d.Id, d.CustomerId, d.Customer.Name, d.VentaId, d.MontoOriginal, d.MontoPagado, d.SaldoPendiente, d.CreatedAt))
            .ToListAsync();
    }

    [HttpPost("{id:guid}/pagar")]
    public async Task<ActionResult<DeudaDto>> RegistrarPago(Guid id, [FromBody] decimal monto)
    {
        var deuda = await db.DeudasClientes.Include(d => d.Customer).FirstOrDefaultAsync(d => d.Id == id && d.TenantId == TenantId);
        if (deuda is null) return NotFound();
        if (monto <= 0 || monto > deuda.SaldoPendiente) return BadRequest("Monto inválido.");

        deuda.MontoPagado += monto;
        deuda.SaldoPendiente -= monto;
        logger.Log(TenantId, Username, "DeudaPago", $"Registró un cobro de ${monto:N2} a \"{deuda.Customer.Name}\"");
        await db.SaveChangesAsync();

        return new DeudaDto(deuda.Id, deuda.CustomerId, deuda.Customer.Name, deuda.VentaId, deuda.MontoOriginal, deuda.MontoPagado, deuda.SaldoPendiente, deuda.CreatedAt);
    }
}
