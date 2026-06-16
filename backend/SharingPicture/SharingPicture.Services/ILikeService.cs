using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface ILikeService
{
    Task<LikeResultDto> ToggleLikeAsync(int postId, int userId);
}

public class LikeResultDto
{
    public int LikeCount { get; set; }
    public bool IsLikedByUser { get; set; }
}
