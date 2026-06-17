using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class ProfileService : IProfileService
{
    private readonly SharingPictureDbContext _context;

    public ProfileService(SharingPictureDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfileDto?> GetProfileByIdAsync(int targetUserId, int? currentUserId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == targetUserId);

        if (user == null) return null;

        var followersCount = await _context.Follows.CountAsync(f => f.FollowedId == targetUserId);
        var followingCount = await _context.Follows.CountAsync(f => f.FollowerId == targetUserId);
        var isFollowing = false;

        if (currentUserId.HasValue)
        {
            isFollowing = await _context.Follows.AnyAsync(f => f.FollowerId == currentUserId.Value && f.FollowedId == targetUserId);
        }

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            IsFollowing = isFollowing
        };
    }

    public async Task<List<Post>> GetProfilePostsAsync(int targetUserId, int? currentUserId, string type)
    {
        if (type == "liked")
        {
            var likedPostsQuery = _context.Likes
                .Where(l => l.UserId == targetUserId && l.Post != null)
                .Select(l => l.Post)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Tags)
                .AsQueryable();

            // Privacy Filter: Exclude private posts unless current user is the owner
            likedPostsQuery = likedPostsQuery.Where(p => p.IsPrivate != true || p.UserId == currentUserId);

            return await likedPostsQuery.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }
        else // default: created
        {
            var createdPostsQuery = _context.Posts
                .Where(p => p.UserId == targetUserId)
                .Include(p => p.User)
                .Include(p => p.Likes)
                .Include(p => p.Tags)
                .AsQueryable();

            // Privacy Filter: Exclude private posts unless the target user matches the current user
            if (targetUserId != currentUserId)
            {
                createdPostsQuery = createdPostsQuery.Where(p => p.IsPrivate != true);
            }

            return await createdPostsQuery.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }
    }

    public async Task<bool> ToggleFollowAsync(int followerId, int followingId)
    {
        if (followerId == followingId)
        {
            throw new InvalidOperationException("You cannot follow yourself.");
        }

        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followingId);

        if (follow != null)
        {
            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();
            return false; // Unfollowed
        }
        else
        {
            var followerExists = await _context.Users.AnyAsync(u => u.Id == followerId);
            var followedExists = await _context.Users.AnyAsync(u => u.Id == followingId);

            if (!followerExists || !followedExists)
            {
                throw new KeyNotFoundException("User not found.");
            }

            follow = new Follow
            {
                FollowerId = followerId,
                FollowedId = followingId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Follows.Add(follow);
            await _context.SaveChangesAsync();
            return true; // Followed
        }
    }

    public async Task<User> UpdateProfileAsync(int userId, string displayName, string? avatarUrl)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            // Verify username uniqueness if user is trying to change it
            if (user.Username != displayName)
            {
                var exists = await _context.Users.AnyAsync(u => u.Username == displayName);
                if (exists)
                {
                    throw new InvalidOperationException("Username is already taken.");
                }
                user.Username = displayName;
            }
        }

        if (avatarUrl != null)
        {
            user.AvatarUrl = avatarUrl;
        }

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<List<FollowUserDto>> GetFollowersAsync(int userId)
    {
        return await _context.Follows
            .Where(f => f.FollowedId == userId && f.Follower != null)
            .Select(f => new FollowUserDto
            {
                Id = f.Follower.Id,
                Username = f.Follower.Username,
                AvatarUrl = f.Follower.AvatarUrl
            })
            .ToListAsync();
    }

    public async Task<List<FollowUserDto>> GetFollowingAsync(int userId)
    {
        return await _context.Follows
            .Where(f => f.FollowerId == userId && f.Followed != null)
            .Select(f => new FollowUserDto
            {
                Id = f.Followed.Id,
                Username = f.Followed.Username,
                AvatarUrl = f.Followed.AvatarUrl
            })
            .ToListAsync();
    }
}
