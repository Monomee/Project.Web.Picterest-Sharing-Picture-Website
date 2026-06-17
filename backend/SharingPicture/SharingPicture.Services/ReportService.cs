using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class ReportService : IReportService
{
    private readonly SharingPictureDbContext _context;

    public ReportService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<Report> ReportPostAsync(int reporterId, int postId, string reason)
    {
        // 1. Validate post exists
        var postExists = await _context.Posts.AnyAsync(p => p.Id == postId);
        if (!postExists)
        {
            throw new KeyNotFoundException("Post not found.");
        }

        // 2. Validate user has not already reported this post
        var alreadyReported = await _context.Reports
            .AnyAsync(r => r.ReporterId == reporterId && r.PostId == postId);
        if (alreadyReported)
        {
            throw new InvalidOperationException("You have already reported this post.");
        }

        // 3. Create new report record
        var report = new Report
        {
            ReporterId = reporterId,
            PostId = postId,
            Reason = reason,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        // 4. Automated Shadow-Ban Logic: Check unique report count for the post
        var uniqueReportCount = await _context.Reports
            .Where(r => r.PostId == postId)
            .Select(r => r.ReporterId)
            .Distinct()
            .CountAsync();

        if (uniqueReportCount >= 5)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post != null)
            {
                post.DeliveryStatus = "hidden";
                await _context.SaveChangesAsync();
            }
        }

        return report;
    }
}
