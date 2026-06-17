using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProfile(int id)
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var profile = await _profileService.GetProfileByIdAsync(id, currentUserId);
        if (profile == null)
        {
            return NotFound(new { message = "Profile not found." });
        }

        return Ok(profile);
    }

    [HttpGet("{id}/posts")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProfilePosts(int id, [FromQuery] string type = "created")
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var posts = await _profileService.GetProfilePostsAsync(id, currentUserId, type);

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
            isLikedByUser = currentUserId.HasValue && p.Likes.Any(l => l.UserId == currentUserId.Value),
            isPrivate = p.IsPrivate,
            tags = p.Tags.Select(t => t.TagName).ToList()
        });

        return Ok(result);
    }

    [HttpGet("{id}/followers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFollowers(int id)
    {
        try
        {
            var followers = await _profileService.GetFollowersAsync(id);
            return Ok(followers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("{id}/following")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFollowing(int id)
    {
        try
        {
            var following = await _profileService.GetFollowingAsync(id);
            return Ok(following);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/follow")]
    public async Task<IActionResult> FollowUser(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var followerId))
        {
            return Unauthorized(new { message = "Invalid or missing user ID claim." });
        }

        try
        {
            var isFollowing = await _profileService.ToggleFollowAsync(followerId, id);
            return Ok(new { isFollowing });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or missing user ID claim." });
        }

        try
        {
            var user = await _profileService.UpdateProfileAsync(userId, request.DisplayName, request.AvatarUrl);
            return Ok(new 
            { 
                message = "Profile updated successfully.",
                username = user.Username,
                avatarUrl = user.AvatarUrl
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "Display name is required.")]
    [MinLength(3, ErrorMessage = "Display name must be at least 3 characters.")]
    [MaxLength(50, ErrorMessage = "Display name cannot exceed 50 characters.")]
    public string DisplayName { get; set; } = null!;

    public string? AvatarUrl { get; set; }
}
