using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectTask
{
    public int Id { get; set; }
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    [MaxLength(1000)]
    public string? Description { get; set; }
    public int DeadlineDays { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProjectTaskAssignment> Assignments { get; set; } = new List<ProjectTaskAssignment>();
}
