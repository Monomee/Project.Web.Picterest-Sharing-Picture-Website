using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class PostService : IPostService
{
    private readonly SharingPictureDbContext _context;

    public PostService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<Post> CreatePostAsync(string caption, string imageUrl, string cloudinaryPublicId, int userId, bool isPrivate, List<string>? tags)
    {
        var post = new Post
        {
            UserId = userId,
            Caption = caption,
            ImageUrl = imageUrl,
            CloudinaryPublicId = cloudinaryPublicId,
            DeliveryStatus = "pending",
            IsPrivate = isPrivate,
            CreatedAt = DateTime.UtcNow
        };

        if (tags != null && tags.Count > 0)
        {
            var tagsList = new List<Tag>();
            foreach (var tagName in tags)
            {
                var cleanName = tagName.Trim().ToLower();
                if (string.IsNullOrEmpty(cleanName)) continue;

                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == cleanName);
                if (tag == null)
                {
                    tag = new Tag { TagName = cleanName };
                    _context.Tags.Add(tag);
                }
                tagsList.Add(tag);
            }
            post.Tags = tagsList;
        }

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();
        return post;
    }

    public async Task<List<Post>> GetFeedPostsAsync(int? currentUserId, int page, int pageSize, string? search)
    {
        IQueryable<Post> query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Where(p => p.IsPrivate != true && p.DeliveryStatus != "hidden");

        if (!string.IsNullOrEmpty(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(p => (p.Caption != null && p.Caption.Contains(cleanSearch)) 
                                     || p.Tags.Any(t => t.TagName == cleanSearch));
        }

        if (currentUserId.HasValue)
        {
            // Personalized Feed: Get followings of the user
            var followedUserIds = _context.Follows
                .Where(f => f.FollowerId == currentUserId.Value)
                .Select(f => f.FollowedId);

            // Prioritize followed users' posts (true evaluates to 1, false to 0, so ordering descending places followed users first)
            query = query.OrderByDescending(p => followedUserIds.Contains(p.UserId))
                         .ThenByDescending(p => p.CreatedAt);
        }
        else
        {
            // Guest Feed: standard chronological
            query = query.OrderByDescending(p => p.CreatedAt);
        }

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<Post?> GetPostByIdAsync(int id)
    {
        return await _context.Posts
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
