using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Projects;

public class TaskInput
{
    [Required, MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    [MaxLength(1000)]
    public string? Description { get; set; }
    [Required, MinLength(1)]
    public int[] AssignedStudentIds { get; set; } = [];
    [Range(1, 365)]
    public int DeadlineDays { get; set; } = 1;
}

public class TaskCompletionInput
{
    public bool Completed { get; set; }
}
