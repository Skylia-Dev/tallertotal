using TallerTotal.Api.Data;
using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

public class ActivityLogger(AppDbContext db)
{
    public void Log(Guid tenantId, string? username, string action, string description)
    {
        db.ActivityLogs.Add(new ActivityLog
        {
            TenantId = tenantId,
            Username = string.IsNullOrWhiteSpace(username) ? "Sistema" : username,
            Action = action,
            Description = description
        });
    }
}
