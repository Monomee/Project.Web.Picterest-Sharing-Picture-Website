using Microsoft.AspNetCore.Http;
using SharingPicture.Data.Context;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace SharingPicture.WebApi.Middleware;

public class UserStatusValidationMiddleware
{
    private readonly RequestDelegate _next;

    public UserStatusValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, SharingPictureDbContext dbContext)
    {
        var user = context.User;
        if (user.Identity != null && user.Identity.IsAuthenticated)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
            {
                // Query user status directly from database
                var userStatus = await dbContext.Users
                    .Where(u => u.Id == userId)
                    .Select(u => u.Status)
                    .FirstOrDefaultAsync();

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
