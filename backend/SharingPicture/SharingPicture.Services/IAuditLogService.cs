using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IAuditLogService
{
    Task LogActionAsync(string actionType, int actorId, int? targetId, string details);
}
