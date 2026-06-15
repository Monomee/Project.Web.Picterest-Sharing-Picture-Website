using SharingPicture.Data.Entities;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IAuthService
{
    Task<User?> RegisterAsync(string username, string email, string password);
    Task<User?> LoginAsync(string usernameOrEmail, string password);
    Task<User?> VerifyGoogleTokenAsync(string idToken);
    string GenerateJwtToken(User user);
}
