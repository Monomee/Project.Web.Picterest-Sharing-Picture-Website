using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet("feed")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // Cap to 100 for safety

        int? userId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var posts = await _postService.GetFeedPostsAsync(userId, page, pageSize);

        var result = posts.Select(p => new
        {
            id = p.Id,
            userId = p.UserId,
            username = p.User?.Username ?? "unknown",
            avatarUrl = p.User?.AvatarUrl,
            caption = p.Caption,
            imageUrl = p.ImageUrl,
            cloudinaryPublicId = p.CloudinaryPublicId,
            createdAt = p.CreatedAt,
            likeCount = p.Likes.Count,
            isLikedByUser = userId.HasValue && p.Likes.Any(l => l.UserId == userId.Value)
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPostById(int id)
    {
        int? userId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var p = await _postService.GetPostByIdAsync(id);
        if (p == null)
        {
            return NotFound(new { message = "Post not found." });
        }

        var result = new
        {
            id = p.Id,
            userId = p.UserId,
            username = p.User?.Username ?? "unknown",
            avatarUrl = p.User?.AvatarUrl,
            caption = p.Caption,
            imageUrl = p.ImageUrl,
            cloudinaryPublicId = p.CloudinaryPublicId,
            createdAt = p.CreatedAt,
            likeCount = p.Likes.Count,
            isLikedByUser = userId.HasValue && p.Likes.Any(l => l.UserId == userId.Value)
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Securely retrieve the authenticated User ID from the JWT NameIdentifier claim
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing user ID claim." });
        }

        var post = await _postService.CreatePostAsync(request.Caption, request.ImageUrl, request.CloudinaryPublicId, userId, request.IsPrivate);

        return Ok(new
        {
            id = post.Id,
            userId = post.UserId,
            caption = post.Caption,
            imageUrl = post.ImageUrl,
            cloudinaryPublicId = post.CloudinaryPublicId,
            createdAt = post.CreatedAt
        });
    }
}

public class CreatePostRequest
{
    [Required(ErrorMessage = "Caption is required.")]
    public string Caption { get; set; } = null!;

    [Required(ErrorMessage = "Image URL is required.")]
    public string ImageUrl { get; set; } = null!;

    [Required(ErrorMessage = "Cloudinary public ID is required.")]
    public string CloudinaryPublicId { get; set; } = null!;

    public bool IsPrivate { get; set; }
}
