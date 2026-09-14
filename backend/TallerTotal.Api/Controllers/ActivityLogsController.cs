using TallerTotal.Api.Data;
using TallerTotal.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Controllers;

[ApiController]
[Route("api/activity-logs")]
[Authorize]
public class ActivityLogsController(AppDbContext db) : ControllerBase
{
    private Guid TenantId => Guid.Parse(User.FindFirst("tenantId")!.Value);

    [HttpGet]
    public async Task<ActionResult<ActivityLogPageDto>> GetAll(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.ActivityLogs.Where(l => l.TenantId == TenantId);

        if (from.HasValue)
            query = query.Where(l => l.CreatedAt >= from.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (to.HasValue)
            query = query.Where(l => l.CreatedAt < to.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new ActivityLogItemDto(l.Id, l.Username, l.Action, l.Description, l.CreatedAt))
            .ToListAsync();

        return new ActivityLogPageDto(items, total, page, pageSize);
    }
}
