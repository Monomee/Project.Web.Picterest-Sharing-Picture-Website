using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class AuditLogService : IAuditLogService
{
    private readonly SharingPictureDbContext _context;

    public AuditLogService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task LogActionAsync(string actionType, int actorId, int? targetId, string details)
    {
        var log = new AuditLog
        {
            ActionType = actionType,
            ActorId = actorId,
            TargetId = targetId,
            Details = details,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}
