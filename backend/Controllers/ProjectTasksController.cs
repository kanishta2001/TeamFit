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
        if (project.OwnerId != CurrentUser.Id(User) && !await IsMember(projectId)) return Forbid();
        var tasks = await Tasks(projectId).AsNoTracking().OrderBy(x => x.CreatedAt).ToListAsync();
        return Ok(tasks.Select(TaskResponse));
    }

    [HttpPost]
    public async Task<IActionResult> Create(int projectId, TaskInput request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var studentIds = request.AssignedStudentIds.Distinct().ToArray();
        if (studentIds.Length == 0 || !await ValidAssignees(projectId, studentIds))
            return BadRequest(new { message = "Assign each task to one or more current team members." });
        var task = new ProjectTask { ProjectRequestId = projectId };
        Apply(task, request);
        foreach (var studentId in studentIds)
            task.Assignments.Add(new ProjectTaskAssignment { StudentId = studentId });
        context.ProjectTasks.Add(task);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return StatusCode(201, await FindTaskResponse(projectId, task.Id));
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
        var studentIds = request.AssignedStudentIds.Distinct().ToHashSet();
        if (studentIds.Count == 0 || !await ValidAssignees(projectId, studentIds))
            return BadRequest(new { message = "Assign each task to one or more current team members." });
        Apply(task, request);
        foreach (var assignment in task.Assignments.Where(x => !studentIds.Contains(x.StudentId)).ToList())
            context.ProjectTaskAssignments.Remove(assignment);
        foreach (var studentId in studentIds.Where(id => task.Assignments.All(x => x.StudentId != id)))
            task.Assignments.Add(new ProjectTaskAssignment { StudentId = studentId });
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(await FindTaskResponse(projectId, taskId));
    }

    [HttpPatch("{taskId:int}/completion")]
    public async Task<IActionResult> UpdateCompletion(int projectId, int taskId, TaskCompletionInput request)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        var studentId = await context.Students.Where(x => x.UserId == CurrentUser.Id(User))
            .Select(x => (int?)x.Id).SingleOrDefaultAsync();
        if (studentId is null || !await context.TeamMembers.AnyAsync(
            x => x.ProjectRequestId == projectId && x.StudentId == studentId)) return Forbid();
        var assignment = await context.ProjectTaskAssignments.Include(x => x.ProjectTask)
            .SingleOrDefaultAsync(x => x.ProjectTaskId == taskId && x.ProjectTask.ProjectRequestId == projectId &&
                x.StudentId == studentId);
        if (assignment is null || assignment.Status != "Accepted") return Forbid();
        assignment.IsCompleted = request.Completed;
        assignment.CompletedAt = request.Completed ? DateTime.UtcNow : null;
        assignment.ProjectTask.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(await FindTaskResponse(projectId, taskId));
    }

    [HttpDelete("{taskId:int}")]
    public async Task<IActionResult> Delete(int projectId, int taskId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var project = await LockProject(projectId);
        if (project is null) return NotFound();
        if (project.OwnerId != CurrentUser.Id(User)) return Forbid();
        var task = await context.ProjectTasks.SingleOrDefaultAsync(x => x.Id == taskId && x.ProjectRequestId == projectId);
        if (task is null) return NotFound();
        context.ProjectTasks.Remove(task);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return NoContent();
    }

    private IQueryable<ProjectTask> Tasks(int projectId) => context.ProjectTasks
        .Include(x => x.Assignments).ThenInclude(x => x.Student)
        .Where(x => x.ProjectRequestId == projectId);

    private Task<ProjectRequest?> LockProject(int id) => context.Projects
        .FromSqlInterpolated($"SELECT * FROM Projects WITH (UPDLOCK, HOLDLOCK) WHERE Id = {id}")
        .SingleOrDefaultAsync();

    private Task<bool> IsMember(int projectId) => context.TeamMembers.AnyAsync(
        x => x.ProjectRequestId == projectId && x.Student.UserId == CurrentUser.Id(User));

    private async Task<bool> ValidAssignees(int projectId, IEnumerable<int> studentIds)
    {
        var ids = studentIds.ToHashSet();
        return await context.TeamMembers.CountAsync(x => x.ProjectRequestId == projectId && ids.Contains(x.StudentId)) == ids.Count;
    }

    private async Task<object> FindTaskResponse(int projectId, int taskId)
    {
        context.ChangeTracker.Clear();
        return TaskResponse(await Tasks(projectId).AsNoTracking().SingleAsync(x => x.Id == taskId));
    }

    private static object TaskResponse(ProjectTask task)
    {
        var accepted = task.Assignments.Where(x => x.Status == "Accepted").ToList();
        var completed = accepted.Count > 0 && task.Assignments.All(x =>
            x.Status == "Rejected" || x.Status == "Accepted" && x.IsCompleted);
        return new
        {
            task.Id, task.Title, task.Description, task.DeadlineDays,
            dueAt = task.CreatedAt.AddDays(task.DeadlineDays), isCompleted = completed,
            assignments = task.Assignments.OrderBy(x => x.Student.FullName).Select(x => new
            {
                x.Id, x.StudentId, fullName = x.Student.FullName, x.Status, x.IsCompleted
            }),
            task.CreatedAt, task.UpdatedAt
        };
    }

    private static void Apply(ProjectTask task, TaskInput request)
    {
        task.Title = request.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        task.DeadlineDays = request.DeadlineDays;
        task.UpdatedAt = DateTime.UtcNow;
    }
}
