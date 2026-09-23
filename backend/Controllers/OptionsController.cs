using Microsoft.AspNetCore.Mvc;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[ApiController]
[Route("api/options")]
public class OptionsController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        roles = ProfileOptions.Roles,
        availabilitySlots = ProfileOptions.AvailabilitySlots
    });
}
