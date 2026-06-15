using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class PostService : IPostService
{
    private readonly SharingPictureDbContext _context;

    public PostService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<Post> CreatePostAsync(string caption, string imageUrl, string cloudinaryPublicId, int userId)
    {
        var post = new Post
        {
            UserId = userId,
            Caption = caption,
            ImageUrl = imageUrl,
            CloudinaryPublicId = cloudinaryPublicId,
            DeliveryStatus = "pending",
            IsPrivate = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();
        return post;
    }
}
