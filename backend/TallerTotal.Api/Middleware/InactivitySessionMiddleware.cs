using TallerTotal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace TallerTotal.Api.Middleware;

/// <summary>
/// Corta la sesión (401) si el usuario autenticado no tuvo actividad (heartbeat del
/// frontend, ver UsersController.PingActivity) en más de Tenant.SessionTimeoutMinutes.
/// Chequeo en vivo contra la base en cada request — no depende de la expiración propia
/// del JWT (que sigue siendo el techo duro de 7 días), así que una sesión ya activa se
/// puede cortar de inmediato si se baja el timeout configurado.
/// </summary>
public class InactivitySessionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var sub = context.User.FindFirst("sub")?.Value;
            if (Guid.TryParse(sub, out var userId))
            {
                var info = await db.Users
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.LastSeenAt, TimeoutMinutes = u.Tenant.SessionTimeoutMinutes })
                    .FirstOrDefaultAsync();

                if (info is not null && info.TimeoutMinutes > 0 && info.LastSeenAt.HasValue &&
                    DateTime.UtcNow - info.LastSeenAt.Value >= TimeSpan.FromMinutes(info.TimeoutMinutes))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { error = "Sesión expirada por inactividad." });
                    return;
                }
            }
        }

        await next(context);
    }
}
