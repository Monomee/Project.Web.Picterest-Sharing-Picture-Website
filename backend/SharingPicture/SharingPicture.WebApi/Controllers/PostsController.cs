using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System.ComponentModel.DataAnnotations;
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

        var post = await _postService.CreatePostAsync(request.Caption, request.ImageUrl, request.CloudinaryPublicId, userId);

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
}
