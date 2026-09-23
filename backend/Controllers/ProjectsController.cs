using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Projects;
using TeamFit.Api.DTOs.Teams;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;
using TeamFit.Api.Services;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/projects")]
public class ProjectsController(TeamFitDbContext context, MatchingService matching) : ControllerBase
{
    private IQueryable<ProjectRequest> Projects() => context.Projects
        .Include(x => x.RequiredSkills).ThenInclude(x => x.Skill)
        .Include(x => x.DesiredRoles).Include(x => x.Availability)
        .Include(x => x.Members).ThenInclude(x => x.Student)
        .Include(x => x.Tasks).ThenInclude(x => x.Assignments).AsSplitQuery();

    private TeamFit.Api.DTOs.Projects.ProjectResponse ToResponse(ProjectRequest project)
    {
        var response = ResponseMapper.Project(project);
        response.IsMember = project.Members.Any(x => x.Student.UserId == CurrentUser.Id(User));
        return response;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(bool mine = false)
    {
        var query = Projects().AsNoTracking();
        if (mine) query = query.Where(x => x.OwnerId == CurrentUser.Id(User) ||
            x.Members.Any(m => m.Student.UserId == CurrentUser.Id(User)));
        return Ok((await query.OrderByDescending(x => x.CreatedAt).ToListAsync()).Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var project = await Projects().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        return project is null ? NotFound() : Ok(ToResponse(project));
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProjectRequestInput request)
    {
        var student = await context.Students.SingleOrDefaultAsync(x => x.UserId == CurrentUser.Id(User));
        if (student is null) return BadRequest(new { message = "Create your student profile before creating a project." });
        if (!await ValidSkills(request.RequiredSkillIds)) return BadRequest(new { message = "Choose skills from the predefined catalog." });
        var project = new ProjectRequest { OwnerId = CurrentUser.Id(User) };
        Apply(project, request);
        project.Members.Add(new TeamMember { StudentId = student.Id });
        context.Projects.Add(project);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        return CreatedAtAction(nameof(GetById), new { id = project.Id },
            ToResponse(await Projects().SingleAsync(x => x.Id == project.Id)));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ProjectRequestInput request)
    {
        // Lock the project while checking capacity so an invitation cannot overfill the team.
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(id);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        await Projects().SingleAsync(x => x.Id == id);
        if (request.TeamSize < project.Members.Count)
            return Conflict(new { message = "Team size cannot be smaller than the current member count." });
        if (!await ValidSkills(request.RequiredSkillIds, project.RequiredSkills.Select(link => link.SkillId).ToHashSet()))
            return BadRequest(new { message = "Choose skills from the predefined catalog." });
        Apply(project, request);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        context.ChangeTracker.Clear();
        return Ok(ToResponse(await Projects().SingleAsync(x => x.Id == id)));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var project = await context.Projects.FindAsync(id);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        context.Projects.Remove(project);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/recommendations")]
    public async Task<IActionResult> Recommendations(int id)
    {
        var project = await Projects().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var memberIds = project.Members.Select(x => x.StudentId).ToArray();
        var students = await context.Students.AsNoTracking()
            .Where(x => x.UserId != null && !memberIds.Contains(x.Id))
            .Include(x => x.StudentSkills).ThenInclude(x => x.Skill)
            .Include(x => x.Availability).AsSplitQuery().ToListAsync();
        // Existing members and unclaimed demo profiles are not invitation candidates.
        return Ok(students.Select(x => matching.Score(project, x))
            .OrderByDescending(x => x.Score).ThenByDescending(x => x.MatchedSkills.Count)
            .ThenBy(x => x.Student.FullName).ThenBy(x => x.Student.Id));
    }

    [HttpGet("{id:int}/members")]
    public async Task<IActionResult> Members(int id)
    {
        if (!await context.Projects.AnyAsync(x => x.Id == id)) return NotFound();
        var members = await context.TeamMembers.AsNoTracking().Where(x => x.ProjectRequestId == id)
            .OrderBy(x => x.JoinedAt).Select(x => new
            {
                studentId = x.StudentId, userId = x.Student.UserId,
                fullName = x.Student.FullName, preferredRole = x.Student.PreferredRole,
                joinedAt = x.JoinedAt
            }).ToListAsync();
        return Ok(members);
    }

    [HttpDelete("{id:int}/members/{studentId:int}")]
    public async Task<IActionResult> RemoveMember(int id, int studentId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(id);
        if (project is null) return NotFound();
        var member = await context.TeamMembers.Include(x => x.Student)
            .SingleOrDefaultAsync(x => x.ProjectRequestId == id && x.StudentId == studentId);
        if (member is null) return NotFound();
        if (member.Student.UserId == project.OwnerId)
            return Conflict(new { message = "The project owner cannot leave their own team. Delete the project instead." });
        if (project.OwnerId != CurrentUser.Id(User) && member.Student.UserId != CurrentUser.Id(User))
            return Forbid();
        // Retain each task while removing the former member's assignment and pending invitation.
        await context.ProjectTaskAssignments.Where(x => x.ProjectTask.ProjectRequestId == id && x.StudentId == studentId)
            .ExecuteDeleteAsync();
        context.TeamMembers.Remove(member);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    [HttpGet("{id:int}/invitations")]
    public async Task<IActionResult> Invitations(int id)
    {
        var project = await context.Projects.FindAsync(id);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        return Ok(await context.Invitations.AsNoTracking().Where(x => x.ProjectRequestId == id)
            .OrderByDescending(x => x.CreatedAt).Select(x => new
            {
                x.Id, x.StudentId, fullName = x.Student.FullName, x.Status, x.CreatedAt
            }).ToListAsync());
    }

    [HttpPost("{id:int}/invitations")]
    public async Task<IActionResult> Invite(int id, InviteStudentRequest request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(id);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        if (project.Status != "Open") return Conflict(new { message = "Only open projects can send invitations." });
        var student = await context.Students.FindAsync(request.StudentId);
        if (student is null || student.UserId is null) return NotFound(new { message = "An active student account is required." });
        if (await context.TeamMembers.AnyAsync(x => x.ProjectRequestId == id && x.StudentId == student.Id))
            return Conflict(new { message = "This student is already a team member." });
        if (await context.TeamMembers.CountAsync(x => x.ProjectRequestId == id) >= project.TeamSize)
            return Conflict(new { message = "The team is already full." });
        var invitation = await context.Invitations.SingleOrDefaultAsync(x => x.ProjectRequestId == id && x.StudentId == student.Id);
        if (invitation?.Status == "Pending") return Conflict(new { message = "This student already has a pending invitation." });
        if (invitation is null)
        {
            invitation = new TeamInvitation { ProjectRequestId = id, StudentId = student.Id };
            context.Invitations.Add(invitation);
        }
        invitation.Status = "Pending";
        invitation.CreatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return StatusCode(201, new { invitation.Id, invitation.StudentId, invitation.Status });
    }

    private Task<ProjectRequest?> LockProject(int id) => context.Projects
        .FromSqlInterpolated($"SELECT * FROM Projects WITH (UPDLOCK, HOLDLOCK) WHERE Id = {id}")
        .SingleOrDefaultAsync();

    private async Task<bool> ValidSkills(int[] ids, HashSet<int>? previouslyAssigned = null)
    {
        var found = await context.Skills.Where(skill => ids.Contains(skill.Id))
            .Select(skill => new { skill.Id, skill.Name }).ToListAsync();
        // Preserve requirements saved before the catalog was fixed, without allowing new custom skills.
        return found.Count == ids.Distinct().Count() &&
            found.All(skill => SkillCatalog.Contains(skill.Name) || previouslyAssigned?.Contains(skill.Id) == true);
    }

    private static void Apply(ProjectRequest project, ProjectRequestInput request)
    {
        project.Title = request.Title.Trim();
        project.Description = request.Description.Trim();
        project.TeamSize = request.TeamSize;
        project.Status = request.Status;
        var skills = request.RequiredSkillIds.ToHashSet();
        foreach (var link in project.RequiredSkills.Where(x => !skills.Contains(x.SkillId)).ToList()) project.RequiredSkills.Remove(link);
        foreach (var id in skills.Where(id => !project.RequiredSkills.Any(x => x.SkillId == id)))
            project.RequiredSkills.Add(new ProjectRequiredSkill { SkillId = id });
        var roles = request.DesiredRoles.ToHashSet();
        foreach (var item in project.DesiredRoles.Where(x => !roles.Contains(x.Role)).ToList()) project.DesiredRoles.Remove(item);
        foreach (var role in roles.Where(role => !project.DesiredRoles.Any(x => x.Role == role)))
            project.DesiredRoles.Add(new ProjectRole { Role = role });
        var slots = request.Availability.ToHashSet();
        foreach (var item in project.Availability.Where(x => !slots.Contains(x.Slot)).ToList()) project.Availability.Remove(item);
        foreach (var slot in slots.Where(slot => !project.Availability.Any(x => x.Slot == slot)))
            project.Availability.Add(new ProjectAvailability { Slot = slot });
    }
}
