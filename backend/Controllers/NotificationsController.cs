using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Activity;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;
using TeamFit.Api.Services;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/notifications")]
public class NotificationsController(TeamFitDbContext context, ActivityFeedService feed) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = CurrentUser.Id(User);
        var lastReadAt = await context.NotificationReadStates.AsNoTracking()
            .Where(x => x.UserId == userId).Select(x => (DateTime?)x.LastReadAt).SingleOrDefaultAsync()
            ?? await context.Users.Where(x => x.Id == userId).Select(x => x.CreatedAt).SingleAsync();
        var entries = await feed.GetEntries(userId);
        return Ok(new NotificationSummary
        {
            UnreadCount = entries.Count(x => x.ActorUserId != userId && x.Item.CreatedAt > lastReadAt),
            Items = entries.Select(x => x.Item).Take(8).ToList()
        });
    }

    [HttpPost("read")]
    public async Task<IActionResult> MarkRead()
    {
        var userId = CurrentUser.Id(User);
        var state = await context.NotificationReadStates.FindAsync(userId);
        if (state is null) context.NotificationReadStates.Add(new NotificationReadState { UserId = userId });
        else state.LastReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return NoContent();
    }
}
