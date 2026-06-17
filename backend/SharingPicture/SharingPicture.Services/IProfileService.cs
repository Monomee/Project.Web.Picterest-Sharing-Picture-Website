using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IProfileService
{
    Task<UserProfileDto?> GetProfileByIdAsync(int targetUserId, int? currentUserId);
    Task<List<Post>> GetProfilePostsAsync(int targetUserId, int? currentUserId, string type);
    Task<bool> ToggleFollowAsync(int followerId, int followingId);
    Task<User> UpdateProfileAsync(int userId, string displayName, string? avatarUrl);
    Task<List<FollowUserDto>> GetFollowersAsync(int userId);
    Task<List<FollowUserDto>> GetFollowingAsync(int userId);
}

public class UserProfileDto
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public bool IsFollowing { get; set; }
}

public class FollowUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string? AvatarUrl { get; set; }
}
