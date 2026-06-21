using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IAdminService
{
    Task<List<ReportDto>> GetPendingReportsAsync(int page, int pageSize);
    Task<bool> ResolveReportAsync(int reportId, int actorId, ReportResolutionDto dto);
    Task<List<AuditLogDto>> GetAuditLogsAsync(int page, int pageSize);
}

public class ReportDto
{
    public int Id { get; set; }
    public int ReporterId { get; set; }
    public string ReporterUsername { get; set; } = null!;
    public int PostId { get; set; }
    public string PostImageUrl { get; set; } = null!;
    public string PostCaption { get; set; } = null!;
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
}

public class ReportResolutionDto
{
    public string Action { get; set; } = null!; // "DELETE_POST", "BAN_USER", "DISMISS"
    public string? Remarks { get; set; }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public int ActorId { get; set; }
    public string ActorUsername { get; set; } = null!;
    public string ActionType { get; set; } = null!;
    public int? TargetId { get; set; }
    public string? Details { get; set; }
    public DateTime? CreatedAt { get; set; }
}
