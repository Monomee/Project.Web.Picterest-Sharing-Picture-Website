using System;

namespace SharingPicture.Services;

public interface IMediaService
{
    SignatureResponseDto GenerateUploadSignature(string folder = "sharing_media");
}

public class SignatureResponseDto
{
    public string Signature { get; set; } = null!;
    public long Timestamp { get; set; }
    public string ApiKey { get; set; } = null!;
    public string UploadPreset { get; set; } = null!;
    public string Folder { get; set; } = null!;
    public string CloudName { get; set; } = null!;
}
