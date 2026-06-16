using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin,moderator")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetPendingReports([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // safety ceiling

        var reports = await _adminService.GetPendingReportsAsync(page, pageSize);
        return Ok(reports);
    }

    [HttpPost("reports/{id}/resolve")]
    public async Task<IActionResult> ResolveReport(int id, [FromBody] ReportResolutionDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Retrieve the moderator (actor) user ID from JWT claims
        var actorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(actorIdClaim) || !int.TryParse(actorIdClaim, out var actorId))
        {
            return Unauthorized(new { message = "Invalid or missing moderator user claims." });
        }

        var result = await _adminService.ResolveReportAsync(id, actorId, dto);
        if (!result)
        {
            return NotFound(new { message = "Report not found." });
        }

        return Ok(new { message = "Report resolved successfully." });
    }
}
