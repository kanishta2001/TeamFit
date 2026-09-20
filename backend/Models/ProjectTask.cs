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
    // A task becomes unassigned if its member leaves; the work history is retained.
    public int? AssignedStudentId { get; set; }
    public Student? AssignedStudent { get; set; }
    [MaxLength(20)]
    public string Status { get; set; } = "Todo";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
