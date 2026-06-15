using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _authService.RegisterAsync(request.Username, request.Email, request.Password);
        if (user == null)
        {
            return BadRequest(new { message = "Username or Email is already taken." });
        }

        var token = _authService.GenerateJwtToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                avatarUrl = user.AvatarUrl
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _authService.LoginAsync(request.UsernameOrEmail, request.Password);
        if (user == null)
        {
            return Unauthorized(new { message = "Invalid username/email or password." });
        }

        var token = _authService.GenerateJwtToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                avatarUrl = user.AvatarUrl
            }
        });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _authService.VerifyGoogleTokenAsync(request.IdToken);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid Google token or authentication failed." });
        }

        var token = _authService.GenerateJwtToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                avatarUrl = user.AvatarUrl
            }
        });
    }
}

public class RegisterRequest
{
    [Required]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters long.")]
    public string Username { get; set; } = null!;

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; } = null!;
}

public class LoginRequest
{
    [Required]
    public string UsernameOrEmail { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = null!;
}
