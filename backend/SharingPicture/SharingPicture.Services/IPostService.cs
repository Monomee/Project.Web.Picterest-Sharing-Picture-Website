using SharingPicture.Data.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IPostService
{
    Task<Post> CreatePostAsync(string caption, string imageUrl, string cloudinaryPublicId, int userId);
    Task<List<Post>> GetFeedPostsAsync(int? currentUserId, int page, int pageSize);
    Task<Post?> GetPostByIdAsync(int id);
}
