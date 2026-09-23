using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectTaskAssignment
{
    public int Id { get; set; }
    public int ProjectTaskId { get; set; }
    public ProjectTask ProjectTask { get; set; } = null!;
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
