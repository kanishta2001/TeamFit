using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Projects;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/projects/{projectId:int}/tasks")]
public class ProjectTasksController(TeamFitDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(int projectId)
    {
        var project = await context.Projects.FindAsync(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User) && !await context.TeamMembers.AnyAsync(
            x => x.ProjectRequestId == projectId && x.Student.UserId == CurrentUser.Id(User)))
            return Forbid();
        return Ok(await Tasks(projectId).AsNoTracking().OrderBy(x => x.CreatedAt)
            .Select(x => new { x.Id, x.Title, x.Description, x.AssignedStudentId,
                assignedStudentName = x.AssignedStudent == null ? null : x.AssignedStudent.FullName,
                x.Status, x.CreatedAt, x.UpdatedAt }).ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create(int projectId, TaskInput request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        if (!await ValidAssignee(projectId, request.AssignedStudentId))
            return BadRequest(new { message = "Assign tasks only to current team members." });
        var task = new ProjectTask { ProjectRequestId = projectId };
        Apply(task, request);
        context.ProjectTasks.Add(task);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return StatusCode(201, await TaskResponse(projectId, task.Id));
    }

    [HttpPut("{taskId:int}")]
    public async Task<IActionResult> Update(int projectId, int taskId, TaskInput request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var task = await Tasks(projectId).SingleOrDefaultAsync(x => x.Id == taskId);
        if (task is null) return NotFound();
        if (!await ValidAssignee(projectId, request.AssignedStudentId))
            return BadRequest(new { message = "Assign tasks only to current team members." });
        Apply(task, request);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(await TaskResponse(projectId, taskId));
    }

    [HttpPatch("{taskId:int}/status")]
    public async Task<IActionResult> UpdateStatus(int projectId, int taskId, TaskStatusInput request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        var task = await Tasks(projectId).SingleOrDefaultAsync(x => x.Id == taskId);
        if (task is null) return NotFound();
        // A member may change only the status of their own assigned work.
        if (project.OwnerId != CurrentUser.Id(User) &&
            (task.AssignedStudent?.UserId != CurrentUser.Id(User) || !await context.TeamMembers.AnyAsync(
                x => x.ProjectRequestId == projectId && x.StudentId == task.AssignedStudentId)))
            return Forbid();
        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(await TaskResponse(projectId, taskId));
    }

    [HttpDelete("{taskId:int}")]
    public async Task<IActionResult> Delete(int projectId, int taskId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var task = await Tasks(projectId).SingleOrDefaultAsync(x => x.Id == taskId);
        if (task is null) return NotFound();
        context.ProjectTasks.Remove(task);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    private IQueryable<ProjectTask> Tasks(int projectId) => context.ProjectTasks
        .Include(x => x.AssignedStudent).Where(x => x.ProjectRequestId == projectId);

    // Membership changes and assignments take the same lock to prevent stale assignments.
    private Task<ProjectRequest?> LockProject(int id) => context.Projects
        .FromSqlInterpolated($"SELECT * FROM Projects WITH (UPDLOCK, HOLDLOCK) WHERE Id = {id}")
        .SingleOrDefaultAsync();

    private async Task<bool> ValidAssignee(int projectId, int? studentId) =>
        studentId is null || await context.TeamMembers.AnyAsync(
            x => x.ProjectRequestId == projectId && x.StudentId == studentId);

    private async Task<object> TaskResponse(int projectId, int taskId)
    {
        var task = await Tasks(projectId).AsNoTracking().SingleAsync(x => x.Id == taskId);
        return new { task.Id, task.Title, task.Description, task.AssignedStudentId,
            assignedStudentName = task.AssignedStudent?.FullName,
            task.Status, task.CreatedAt, task.UpdatedAt };
    }

    private static void Apply(ProjectTask task, TaskInput request)
    {
        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.AssignedStudentId = request.AssignedStudentId;
        task.Status = request.Status;
        task.UpdatedAt = DateTime.UtcNow;
    }
}
