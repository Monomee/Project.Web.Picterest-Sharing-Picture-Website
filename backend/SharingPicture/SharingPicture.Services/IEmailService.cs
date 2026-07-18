using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
    Task SendResetPasswordEmailAsync(string toEmail, string token);
}
