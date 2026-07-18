using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlMessage
        };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            // Connect using StartTls on port 587
            await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.Port, SecureSocketOptions.StartTls);

            // Authenticate using the configured credentials
            await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);

            // Send message
            await client.SendAsync(message);
        }
        catch (Exception)
        {
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }

    public async Task SendResetPasswordEmailAsync(string toEmail, string token)
    {
        var resetLink = $"{_emailSettings.FrontendBaseUrl}/reset-password?token={token}&email={System.Uri.EscapeDataString(toEmail)}";
        
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

        await SendEmailAsync(toEmail, "Picterest Password Reset Link", htmlBody);
    }
}
