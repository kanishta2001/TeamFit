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
    public async Task<IActionResult> Inbox() => Ok(await context.Invitations.AsNoTracking()
        .Where(x => x.Student.UserId == CurrentUser.Id(User))
        .OrderByDescending(x => x.CreatedAt)
        .Select(x => new
        {
            x.Id, projectId = x.ProjectRequestId, title = x.ProjectRequest.Title,
            projectStatus = x.ProjectRequest.Status, x.Status, x.CreatedAt
        }).ToListAsync());

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
