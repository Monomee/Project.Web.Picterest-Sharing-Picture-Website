using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface ICommentService
{
    Task<List<CommentDto>> GetCommentsByPostIdAsync(int postId);
    Task<CommentDto> AddCommentAsync(int postId, int userId, string content);
}

public class CommentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public string Content { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
}
