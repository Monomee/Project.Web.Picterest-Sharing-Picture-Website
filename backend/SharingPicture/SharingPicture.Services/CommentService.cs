using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class CommentService : ICommentService
{
    private readonly SharingPictureDbContext _context;

    public CommentService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommentDto>> GetCommentsByPostIdAsync(int postId)
    {
        return await _context.Comments
            .Include(c => c.User)
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                UserId = c.UserId,
                Username = c.User.Username,
                AvatarUrl = c.User.AvatarUrl,
                Content = c.Content,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<CommentDto> AddCommentAsync(int postId, int userId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Comment content cannot be empty.");
        }

        var newComment = new Comment
        {
            PostId = postId,
            UserId = userId,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(newComment);
        await _context.SaveChangesAsync();

        // Retrieve User info to fully populate CommentDto
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        return new CommentDto
        {
            Id = newComment.Id,
            UserId = newComment.UserId,
            Username = user?.Username ?? "unknown",
            AvatarUrl = user?.AvatarUrl,
            Content = newComment.Content,
            CreatedAt = newComment.CreatedAt
        };
    }
}
