using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Services;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/activity")]
public class ActivityController(ActivityFeedService feed) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok((await feed.GetEntries(CurrentUser.Id(User)))
        .Select(x => x.Item));
}
