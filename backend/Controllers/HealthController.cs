using Microsoft.AspNetCore.Mvc;

namespace TeamFit.Api.Controllers;

/// <summary>
/// Provides a simple endpoint to confirm that the TeamFit API is running.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        // This temporary endpoint is useful before real TeamFit features are added.
        return Ok(new
        {
            status = "Healthy",
            service = "TeamFit API",
            message = "The TeamFit API is running."
        });
    }
}
