using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpGet("signature")]
    public IActionResult GetSignature([FromQuery] string folder = "sharing_media")
    {
        var result = _mediaService.GenerateUploadSignature(folder);
        return Ok(result);
    }
}
