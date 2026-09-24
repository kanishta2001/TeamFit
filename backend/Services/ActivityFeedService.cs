using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Activity;

namespace TeamFit.Api.Services;

public class ActivityFeedService(TeamFitDbContext context)
{
    public async Task<IReadOnlyList<ActivityEntry>> GetEntries(int userId, int limit = 50)
    {
        var projectIds = await context.Projects.AsNoTracking()
            .Where(x => x.OwnerId == userId || x.Members.Any(m => m.Student.UserId == userId))
            .Select(x => x.Id).ToListAsync();
        var names = await context.Students.AsNoTracking().Where(x => x.UserId != null)
            .ToDictionaryAsync(x => x.UserId!.Value, x => x.FullName);
        var entries = new List<ActivityEntry>();

        var projects = await context.Projects.AsNoTracking().Where(x => projectIds.Contains(x.Id))
            .OrderByDescending(x => x.CreatedAt).Take(limit)
            .Select(x => new { x.Id, x.Title, x.OwnerId, x.CreatedAt }).ToListAsync();
        entries.AddRange(projects.Select(x => Entry($"project-{x.Id}", "ProjectCreated", "Project created",
            x.Title, x.CreatedAt, $"/projects/{x.Id}", x.OwnerId)));

        var tasks = await context.ProjectTasks.AsNoTracking().Where(x => projectIds.Contains(x.ProjectRequestId))
            .OrderByDescending(x => x.CreatedAt).Take(limit)
            .Select(x => new { x.Id, x.Title, x.ProjectRequestId, ProjectTitle = x.ProjectRequest.Title,
                OwnerId = x.ProjectRequest.OwnerId, x.CreatedAt }).ToListAsync();
        entries.AddRange(tasks.Select(x => Entry($"task-{x.Id}", "TaskCreated", "Task created",
            $"{x.Title} · {x.ProjectTitle}", x.CreatedAt, $"/projects/{x.ProjectRequestId}", x.OwnerId)));

        var assignments = await context.ProjectTaskAssignments.AsNoTracking()
            .Where(x => projectIds.Contains(x.ProjectTask.ProjectRequestId))
            .OrderByDescending(x => x.CreatedAt).Take(limit * 2)
            .Select(x => new { x.Id, x.Status, x.Student.UserId, x.Student.FullName, x.CreatedAt,
                x.RespondedAt, x.CompletedAt, TaskTitle = x.ProjectTask.Title,
                ProjectId = x.ProjectTask.ProjectRequestId, ProjectTitle = x.ProjectTask.ProjectRequest.Title,
                OwnerId = x.ProjectTask.ProjectRequest.OwnerId }).ToListAsync();
        foreach (var item in assignments)
        {
            if (item.Status == "Pending" && item.UserId == userId)
                entries.Add(Entry($"task-invite-{item.Id}", "Invitation", "New task invitation",
                    $"{item.TaskTitle} · {item.ProjectTitle}", item.CreatedAt, "/invitations", item.OwnerId));
            if (item.Status == "Accepted" && item.RespondedAt is DateTime acceptedAt)
                entries.Add(Entry($"task-accepted-{item.Id}", "TaskAccepted", "Task accepted",
                    $"{item.FullName} accepted {item.TaskTitle}", acceptedAt, $"/projects/{item.ProjectId}", item.UserId));
            if (item.CompletedAt is DateTime completedAt)
                entries.Add(Entry($"task-completed-{item.Id}", "TaskCompleted", "Task completed",
                    $"{item.FullName} completed {item.TaskTitle}", completedAt, $"/projects/{item.ProjectId}", item.UserId));
        }

        var invitations = await context.Invitations.AsNoTracking()
            .Where(x => x.Student.UserId == userId && x.Status == "Pending")
            .OrderByDescending(x => x.CreatedAt).Take(limit)
            .Select(x => new { x.Id, x.CreatedAt, ProjectId = x.ProjectRequestId,
                ProjectTitle = x.ProjectRequest.Title, OwnerId = x.ProjectRequest.OwnerId }).ToListAsync();
        entries.AddRange(invitations.Select(x => Entry($"project-invite-{x.Id}", "Invitation", "New project invitation",
            x.ProjectTitle, x.CreatedAt, "/invitations", x.OwnerId)));

        var joins = await context.TeamMembers.AsNoTracking().Where(x => projectIds.Contains(x.ProjectRequestId))
            .OrderByDescending(x => x.JoinedAt).Take(limit)
            .Select(x => new { x.ProjectRequestId, x.StudentId, x.Student.UserId, x.Student.FullName,
                ProjectTitle = x.ProjectRequest.Title, x.JoinedAt }).ToListAsync();
        entries.AddRange(joins.Where(x => x.UserId != null).Select(x => Entry(
            $"member-{x.ProjectRequestId}-{x.StudentId}", "MemberJoined", "Team member joined",
            $"{x.FullName} joined {x.ProjectTitle}", x.JoinedAt, $"/projects/{x.ProjectRequestId}", x.UserId)));

        var messages = await context.ProjectMessages.AsNoTracking().Where(x => projectIds.Contains(x.ProjectRequestId))
            .OrderByDescending(x => x.CreatedAt).Take(limit)
            .Select(x => new { x.Id, x.ProjectRequestId, x.SenderUserId, x.Body, x.CreatedAt,
                ProjectTitle = x.ProjectRequest.Title }).ToListAsync();
        entries.AddRange(messages.Select(x => Entry($"message-{x.Id}", "Message", "New team message",
            $"{names.GetValueOrDefault(x.SenderUserId, "Team member")}: {Preview(x.Body)}",
            x.CreatedAt, "/chats", x.SenderUserId)));

        return entries.OrderByDescending(x => x.Item.CreatedAt).Take(limit).ToList();
    }

    private static ActivityEntry Entry(string id, string type, string title, string detail,
        DateTime createdAt, string href, int? actorUserId) => new()
        {
            ActorUserId = actorUserId,
            Item = new ActivityFeedItem { Id = id, Type = type, Title = title, Detail = detail,
                CreatedAt = createdAt, Href = href }
        };

    private static string Preview(string value) => value.Length <= 70 ? value : value[..67] + "…";
}

public class ActivityEntry
{
    public int? ActorUserId { get; set; }
    public ActivityFeedItem Item { get; set; } = new();
}
