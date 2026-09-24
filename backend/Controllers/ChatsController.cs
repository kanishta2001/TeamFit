using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Chats;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/chats")]
public class ChatsController(TeamFitDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Threads()
    {
        var userId = CurrentUser.Id(User);
        var projects = await AccessibleProjects(userId).AsNoTracking()
            .Select(x => new { x.Id, x.Title }).OrderBy(x => x.Title).ToListAsync();
        var ids = projects.Select(x => x.Id).ToArray();
        var reads = await context.ProjectChatReadStates.AsNoTracking()
            .Where(x => x.UserId == userId && ids.Contains(x.ProjectRequestId))
            .ToDictionaryAsync(x => x.ProjectRequestId, x => x.LastReadAt);
        var messages = await context.ProjectMessages.AsNoTracking()
            .Where(x => ids.Contains(x.ProjectRequestId)).OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.ProjectRequestId, x.SenderUserId, x.Body, x.CreatedAt }).ToListAsync();
        return Ok(projects.Select(project =>
        {
            var projectMessages = messages.Where(x => x.ProjectRequestId == project.Id).ToList();
            var last = projectMessages.FirstOrDefault();
            var readAt = reads.GetValueOrDefault(project.Id, DateTime.MinValue);
            return new ChatThreadResponse
            {
                ProjectId = project.Id, ProjectTitle = project.Title,
                UnreadCount = projectMessages.Count(x => x.SenderUserId != userId && x.CreatedAt > readAt),
                LastMessage = last is null ? null : Preview(last.Body), LastMessageAt = last?.CreatedAt
            };
        }));
    }

    [HttpGet("{projectId:int}/messages")]
    public async Task<IActionResult> Messages(int projectId)
    {
        var userId = CurrentUser.Id(User);
        if (!await CanAccess(projectId, userId)) return Forbid();
        var names = await context.Students.AsNoTracking().Where(x => x.UserId != null)
            .ToDictionaryAsync(x => x.UserId!.Value, x => x.FullName);
        var messages = await context.ProjectMessages.AsNoTracking().Where(x => x.ProjectRequestId == projectId)
            .OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync();
        messages.Reverse();
        return Ok(messages.Select(x => MapResponse(x, userId, names)));
    }

    [HttpPost("{projectId:int}/messages")]
    public async Task<IActionResult> Send(int projectId, ChatMessageInput input)
    {
        var userId = CurrentUser.Id(User);
        if (!await CanAccess(projectId, userId)) return Forbid();
        var body = input.Body.Trim();
        if (body.Length == 0) return BadRequest(new { message = "Enter a message." });
        var message = new ProjectMessage { ProjectRequestId = projectId, SenderUserId = userId, Body = body };
        context.ProjectMessages.Add(message);
        await context.SaveChangesAsync();
        var name = await context.Students.Where(x => x.UserId == userId).Select(x => x.FullName).SingleAsync();
        return StatusCode(201, MapResponse(message, userId, new Dictionary<int, string> { [userId] = name }));
    }

    [HttpPost("{projectId:int}/read")]
    public async Task<IActionResult> MarkRead(int projectId)
    {
        var userId = CurrentUser.Id(User);
        if (!await CanAccess(projectId, userId)) return Forbid();
        var state = await context.ProjectChatReadStates.FindAsync(projectId, userId);
        if (state is null) context.ProjectChatReadStates.Add(new ProjectChatReadState
            { ProjectRequestId = projectId, UserId = userId });
        else state.LastReadAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return NoContent();
    }

    private IQueryable<ProjectRequest> AccessibleProjects(int userId) => context.Projects
        .Where(x => x.OwnerId == userId || x.Members.Any(m => m.Student.UserId == userId));

    private Task<bool> CanAccess(int projectId, int userId) => AccessibleProjects(userId)
        .AnyAsync(x => x.Id == projectId);

    private static ChatMessageResponse MapResponse(ProjectMessage message, int userId,
        IReadOnlyDictionary<int, string> names) => new()
        {
            Id = message.Id, ProjectId = message.ProjectRequestId, SenderUserId = message.SenderUserId,
            SenderName = names.GetValueOrDefault(message.SenderUserId, "Team member"), Body = message.Body,
            CreatedAt = message.CreatedAt, IsMine = message.SenderUserId == userId
        };

    private static string Preview(string value) => value.Length <= 70 ? value : value[..67] + "…";
}
