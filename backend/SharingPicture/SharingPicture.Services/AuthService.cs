using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SharingPicture.Data.Context;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class AuthService : IAuthService
{
    private readonly SharingPictureDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(SharingPictureDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<User?> RegisterAsync(string username, string email, string password)
    {
        // Check if username or email already exists
        if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email))
        {
            return null;
        }

        // Hash password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        // Get or create the default 'user' role
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "user");
        if (role == null)
        {
            role = new Role { RoleName = "user" };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var newUser = new User
        {
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            Status = "active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        var userRole = new UserRole
        {
            UserId = newUser.Id,
            RoleId = role.Id
        };
        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        // Load relations for JWT generation
        newUser.UserRoles = new List<UserRole> { userRole };
        userRole.Role = role;

        return newUser;
    }

    public async Task<User?> LoginAsync(string usernameOrEmail, string password)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail);

        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            return null;
        }

        // Verify password using BCrypt
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return null;
        }

        return user;
    }

    public async Task<User?> VerifyGoogleTokenAsync(string idToken)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"];
            var validationSettings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            // Validate the token and get the payload
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, validationSettings);
            if (payload == null)
            {
                return null;
            }

            // Check if user already exists
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user != null)
            {
                return user;
            }

            // Create new user if they do not exist
            // Extract base username from email address
            string baseUsername = payload.Email.Split('@')[0];
            string uniqueUsername = baseUsername;
            
            // Loop to ensure username is unique
            int counter = 1;
            while (await _context.Users.AnyAsync(u => u.Username == uniqueUsername))
            {
                uniqueUsername = $"{baseUsername}{new Random().Next(1000, 9999)}";
                counter++;
                if (counter > 10) // Fallback check to avoid infinite loop
                {
                    uniqueUsername = $"{baseUsername}_{Guid.NewGuid().ToString("N").Substring(0, 6)}";
                    break;
                }
            }

            // Seed default 'user' role
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "user");
            if (role == null)
            {
                role = new Role { RoleName = "user" };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            // Generate a secure random password hash since this is an OAuth user
            var dummyPasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString());

            var newUser = new User
            {
                Username = uniqueUsername,
                Email = payload.Email,
                PasswordHash = dummyPasswordHash,
                AvatarUrl = payload.Picture,
                Status = "active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var userRole = new UserRole
            {
                UserId = newUser.Id,
                RoleId = role.Id
            };
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();

            // Load relations for JWT generation
            newUser.UserRoles = new List<UserRole> { userRole };
            userRole.Role = role;

            return newUser;
        }
        catch (Exception)
        {
            return null;
        }
    }

    public string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var secretKey = _configuration["Jwt:Secret"];
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT Secret is not configured.");
        }

        var key = Encoding.UTF8.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("userId", user.Id.ToString()),
            new Claim("username", user.Username)
        };

        // Add role claims
        if (user.UserRoles != null)
        {
            foreach (var userRole in user.UserRoles)
            {
                if (userRole.Role != null)
                {
                    claims.Add(new Claim(ClaimTypes.Role, userRole.Role.RoleName));
                }
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
