using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class LikeService : ILikeService
{
    private readonly SharingPictureDbContext _context;

    public LikeService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<LikeResultDto> ToggleLikeAsync(int postId, int userId)
    {
        var existingLike = await _context.Likes
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

        if (existingLike != null)
        {
            _context.Likes.Remove(existingLike);
        }
        else
        {
            var newLike = new Like
            {
                PostId = postId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Likes.Add(newLike);
        }

        await _context.SaveChangesAsync();

        var totalLikes = await _context.Likes.CountAsync(l => l.PostId == postId);
        var isLiked = await _context.Likes.AnyAsync(l => l.PostId == postId && l.UserId == userId);

        return new LikeResultDto
        {
            LikeCount = totalLikes,
            IsLikedByUser = isLiked
        };
    }
}
