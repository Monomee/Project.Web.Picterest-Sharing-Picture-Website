using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class AdminService : IAdminService
{
    private readonly SharingPictureDbContext _context;
    private readonly IAuditLogService _auditLogService;

    public AdminService(SharingPictureDbContext context, IAuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<List<ReportDto>> GetPendingReportsAsync(int page, int pageSize)
    {
        return await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.Post)
            .Where(r => r.Status == "pending" || r.Status == null)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReportDto
            {
                Id = r.Id,
                ReporterId = r.ReporterId,
                ReporterUsername = r.Reporter.Username,
                PostId = r.PostId,
                PostImageUrl = r.Post != null ? (r.Post.ImageUrl ?? "") : "",
                PostCaption = r.Post != null ? (r.Post.Caption ?? "") : "",
                Reason = r.Reason,
                Status = r.Status ?? "pending",
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> ResolveReportAsync(int reportId, int actorId, ReportResolutionDto dto)
    {
        var report = await _context.Reports
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.Id == reportId);

        if (report == null)
        {
            return false;
        }

        // Standardize action capitalization
        string action = dto.Action.ToUpper();

        // Update the report's status and logging moderator
        report.Status = action == "DISMISS" ? "dismissed" : "resolved";
        report.ModeratorId = actorId;

        if (action == "DELETE_POST")
        {
            if (report.Post != null)
            {
                int postId = report.PostId;
                string caption = report.Post.Caption ?? "";

                // Programmatic Cascade Deletes to avoid SQL foreign key constraints
                // 1. Remove comments
                var comments = _context.Comments.Where(c => c.PostId == postId);
                _context.Comments.RemoveRange(comments);

                // 2. Remove likes
                var likes = _context.Likes.Where(l => l.PostId == postId);
                _context.Likes.RemoveRange(likes);

                // 3. Remove all other reports associated with this post (including current report)
                var relatedReports = _context.Reports.Where(r => r.PostId == postId);
                _context.Reports.RemoveRange(relatedReports);

                // 4. Remove post
                _context.Posts.Remove(report.Post);

                // Central Audit Log
                await _auditLogService.LogActionAsync(
                    "DELETE_POST",
                    actorId,
                    postId,
                    $"Deleted post: {caption}. Original reported reason: {report.Reason}. Remarks: {dto.Remarks}"
                );
            }
        }
        else if (action == "BAN_USER")
        {
            if (report.Post != null)
            {
                var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == report.Post.UserId);
                if (targetUser != null)
                {
                    targetUser.Status = "banned";

                    // Central Audit Log
                    await _auditLogService.LogActionAsync(
                        "BAN_USER",
                        actorId,
                        targetUser.Id,
                        $"Banned user: {targetUser.Username} (ID: {targetUser.Id}) following post infraction. Remarks: {dto.Remarks}"
                    );
                }
            }
        }
        else if (action == "DISMISS")
        {
            if (report.Post != null)
            {
                report.Post.DeliveryStatus = "pending";
            }

            // Central Audit Log
            await _auditLogService.LogActionAsync(
                "DISMISS_REPORT",
                actorId,
                report.Id,
                $"Dismissed report (ID: {report.Id}) for post (ID: {report.PostId}). Remarks: {dto.Remarks}"
            );
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
