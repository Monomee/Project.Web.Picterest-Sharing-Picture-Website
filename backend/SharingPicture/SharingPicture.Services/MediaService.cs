using Microsoft.Extensions.Options;
using System;
using System.Security.Cryptography;
using System.Text;

namespace SharingPicture.Services;

public class MediaService : IMediaService
{
    private readonly CloudinarySettings _settings;

    public MediaService(IOptions<CloudinarySettings> options)
    {
        _settings = options.Value;
    }

    public SignatureResponseDto GenerateUploadSignature(string folder = "sharing_media")
    {
        // Cloudinary expects Unix timestamp in seconds
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        // Parameters sorted alphabetically:
        // folder, timestamp, upload_preset
        // Joined by '&', followed directly by ApiSecret (no trailing '&')
        var stringToSign = $"folder={folder}&timestamp={timestamp}&upload_preset={_settings.UploadPreset}{_settings.ApiSecret}";

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        
        // Convert to lowercase hex string as required by Cloudinary
        var signature = Convert.ToHexString(hashBytes).ToLower();

        return new SignatureResponseDto
        {
            Signature = signature,
            Timestamp = timestamp,
            ApiKey = _settings.ApiKey,
            UploadPreset = _settings.UploadPreset,
            Folder = folder,
            CloudName = _settings.CloudName
        };
    }
}
