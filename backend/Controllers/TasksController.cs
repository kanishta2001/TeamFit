using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.Infrastructure;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/tasks")]
public class TasksController(TeamFitDbContext context) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<IActionResult> Mine()
    {
        var userId = CurrentUser.Id(User);
        return Ok(await context.ProjectTaskAssignments.AsNoTracking()
            .Where(x => x.Student.UserId == userId && x.Status == "Accepted" &&
                x.ProjectTask.ProjectRequest.Members.Any(m => m.StudentId == x.StudentId))
            .OrderBy(x => x.ProjectTask.CreatedAt.AddDays(x.ProjectTask.DeadlineDays))
            .Select(x => new
            {
                assignmentId = x.Id, taskId = x.ProjectTaskId,
                projectId = x.ProjectTask.ProjectRequestId,
                projectTitle = x.ProjectTask.ProjectRequest.Title,
                title = x.ProjectTask.Title, x.ProjectTask.Description,
                deadlineAt = x.ProjectTask.CreatedAt.AddDays(x.ProjectTask.DeadlineDays),
                x.IsCompleted
            }).ToListAsync());
    }
}
