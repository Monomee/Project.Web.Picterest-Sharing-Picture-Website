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
    private readonly IEmailService _emailService;

    public AuthController(IAuthService authService, IEmailService emailService)
    {
        _authService = authService;
        _emailService = emailService;
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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var token = await _authService.GenerateResetTokenAsync(request.Email);
            if (token == null)
            {
                return NotFound(new { message = "Email address not found." });
            }

            var resetLink = $"http://localhost:3000/reset-password?token={token}&email={System.Uri.EscapeDataString(request.Email)}";
            
            var htmlBody = $@"
                <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fafafa;"">
                    <h2 style=""color: #6366f1; text-align: center;"">Picterest Password Reset</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset the password for your Picterest account. Click the button below to set a new password. This link is valid for 15 minutes.</p>
                    <div style=""text-align: center; margin: 30px 0;"">
                        <a href=""{resetLink}"" style=""background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;"">Reset Password</a>
                    </div>
                    <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                    <p style=""word-break: break-all; color: #6366f1;"">{resetLink}</p>
                    <hr style=""border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"" />
                    <p style=""font-size: 12px; color: #999;"">If you did not request a password reset, please ignore this email.</p>
                </div>";

            await _emailService.SendEmailAsync(request.Email, "Picterest Password Reset Link", htmlBody);

            return Ok(new
            {
                message = "Email hướng dẫn đặt lại mật khẩu đã được gửi đi thành công. Vui lòng kiểm tra hộp thư."
            });
        }
        catch (System.Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _authService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword);
            if (!result)
            {
                return BadRequest(new { message = "Invalid reset token or email, or the token has expired." });
            }

            return Ok(new { message = "Password reset successfully." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = null!;
}

public class ResetPasswordRequest
{
    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = null!;

    [Required]
    public string Token { get; set; } = null!;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string NewPassword { get; set; } = null!;
}
