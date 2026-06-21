using Microsoft.AspNetCore.Http;
using SharingPicture.Data.Context;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.Extensions.Caching.Distributed;

namespace SharingPicture.WebApi.Middleware;

public class UserStatusValidationMiddleware
{
    private readonly RequestDelegate _next;

    public UserStatusValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, SharingPictureDbContext dbContext, IDistributedCache cache)
    {
        var user = context.User;
        if (user.Identity != null && user.Identity.IsAuthenticated)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
            {
                var cacheKey = $"user-status:{userId}";
                string? userStatus = null;
                try
                {
                    userStatus = await cache.GetStringAsync(cacheKey);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Redis status fetch failed for user {userId}: {ex.Message}");
                }

                if (userStatus == null)
                {
                    // Query user status directly from database
                    userStatus = await dbContext.Users
                        .Where(u => u.Id == userId)
                        .Select(u => u.Status)
                        .FirstOrDefaultAsync();

                    if (userStatus != null)
                    {
                        try
                        {
                            var cacheOptions = new DistributedCacheEntryOptions
                            {
                                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                            };
                            await cache.SetStringAsync(cacheKey, userStatus, cacheOptions);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Redis status cache set failed for user {userId}: {ex.Message}");
                        }
                    }
                }

                if (userStatus != "active")
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new { message = "Your account has been deactivated or banned." });
                    return;
                }
            }
        }

        await _next(context);
    }
}
