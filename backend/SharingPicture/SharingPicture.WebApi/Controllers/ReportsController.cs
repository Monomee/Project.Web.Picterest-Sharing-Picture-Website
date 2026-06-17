using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharingPicture.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SharingPicture.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var reporterId))
        {
            return Unauthorized(new { message = "Invalid or missing user ID claim." });
        }

        try
        {
            var report = await _reportService.ReportPostAsync(reporterId, request.PostId, request.Reason);
            return Ok(new
            {
                message = "Post reported successfully.",
                reportId = report.Id
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}

public class CreateReportRequest
{
    [Required(ErrorMessage = "PostId is required.")]
    public int PostId { get; set; }

    [Required(ErrorMessage = "Reason is required.")]
    [MinLength(3, ErrorMessage = "Reason must be at least 3 characters.")]
    [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters.")]
    public string Reason { get; set; } = null!;
}
