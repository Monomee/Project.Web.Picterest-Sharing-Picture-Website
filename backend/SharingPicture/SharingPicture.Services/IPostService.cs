using SharingPicture.Data.Entities;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IPostService
{
    Task<Post> CreatePostAsync(string caption, string imageUrl, string cloudinaryPublicId, int userId);
}
