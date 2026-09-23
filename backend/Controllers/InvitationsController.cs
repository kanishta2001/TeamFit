using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Teams;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/invitations")]
public class InvitationsController(TeamFitDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Inbox()
    {
        var userId = CurrentUser.Id(User);
        var projectInvitations = await context.Invitations.AsNoTracking()
        .Where(x => x.Student.UserId == userId)
        .Select(x => new InvitationInboxItem
        {
            Id = x.Id, Kind = "Project", ProjectId = x.ProjectRequestId, Title = x.ProjectRequest.Title,
            ProjectStatus = x.ProjectRequest.Status, Status = x.Status, CreatedAt = x.CreatedAt
        }).ToListAsync();
        var taskInvitations = await context.ProjectTaskAssignments.AsNoTracking()
            .Where(x => x.Student.UserId == userId)
            .Select(x => new InvitationInboxItem
            {
                Id = x.Id, Kind = "Task", ProjectId = x.ProjectTask.ProjectRequestId,
                Title = x.ProjectTask.ProjectRequest.Title, ProjectStatus = x.ProjectTask.ProjectRequest.Status,
                Status = x.Status, CreatedAt = x.CreatedAt, TaskId = x.ProjectTaskId,
                TaskTitle = x.ProjectTask.Title,
                DeadlineAt = x.ProjectTask.CreatedAt.AddDays(x.ProjectTask.DeadlineDays)
            }).ToListAsync();
        return Ok(projectInvitations.Concat(taskInvitations).OrderByDescending(x => x.CreatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Decide(int id, InvitationDecision decision)
    {
        var reference = await context.Invitations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (reference is null) return NotFound();
        await using var transaction = await context.Database.BeginTransactionAsync();
        // All membership mutations lock the same project row, protecting the final team slot.
        var project = await context.Projects
            .FromSqlInterpolated($"SELECT * FROM Projects WITH (UPDLOCK, HOLDLOCK) WHERE Id = {reference.ProjectRequestId}")
            .SingleOrDefaultAsync();
        if (project is null) return NotFound();
        var invitation = await context.Invitations.Include(x => x.Student).SingleOrDefaultAsync(x => x.Id == id);
        if (invitation is null) return NotFound();
        if (invitation.Student.UserId != CurrentUser.Id(User)) return Forbid();
        if (invitation.Status != "Pending") return Conflict(new { message = "This invitation has already been answered or cancelled." });
        if (decision.Status == "Accepted")
        {
            if (project.Status != "Open") return Conflict(new { message = "This project is no longer accepting members." });
            if (await context.TeamMembers.CountAsync(x => x.ProjectRequestId == project.Id) >= project.TeamSize)
                return Conflict(new { message = "The team is full. You can reject this invitation." });
            if (await context.TeamMembers.AnyAsync(x => x.ProjectRequestId == project.Id && x.StudentId == invitation.StudentId))
                return Conflict(new { message = "You are already a member of this team." });
            context.TeamMembers.Add(new TeamMember { ProjectRequestId = project.Id, StudentId = invitation.StudentId });
        }
        invitation.Status = decision.Status;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { invitation.Id, invitation.Status });
    }

    [HttpPut("tasks/{id:int}")]
    public async Task<IActionResult> DecideTask(int id, InvitationDecision decision)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var assignment = await context.ProjectTaskAssignments
            .Include(x => x.Student).Include(x => x.ProjectTask)
            .SingleOrDefaultAsync(x => x.Id == id);
        if (assignment is null) return NotFound();
        if (assignment.Student.UserId != CurrentUser.Id(User)) return Forbid();
        if (assignment.Status != "Pending")
            return Conflict(new { message = "This task invitation has already been answered." });
        if (!await context.TeamMembers.AnyAsync(x => x.ProjectRequestId == assignment.ProjectTask.ProjectRequestId &&
            x.StudentId == assignment.StudentId))
            return Conflict(new { message = "You are no longer a member of this project team." });
        assignment.Status = decision.Status;
        assignment.RespondedAt = DateTime.UtcNow;
        assignment.IsCompleted = false;
        assignment.CompletedAt = null;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { assignment.Id, assignment.Status });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var reference = await context.Invitations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (reference is null) return NotFound();
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await context.Projects
            .FromSqlInterpolated($"SELECT * FROM Projects WITH (UPDLOCK, HOLDLOCK) WHERE Id = {reference.ProjectRequestId}")
            .SingleOrDefaultAsync();
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var invitation = await context.Invitations.SingleOrDefaultAsync(x => x.Id == id);
        if (invitation is null) return NotFound();
        if (invitation.Status != "Pending") return Conflict(new { message = "Only pending invitations can be cancelled." });
        invitation.Status = "Cancelled";
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }
}
