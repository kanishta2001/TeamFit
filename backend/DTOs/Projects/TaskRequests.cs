using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Projects;

public class TaskInput
{
    [Required, MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    [MaxLength(1000)]
    public string? Description { get; set; }
    [Range(1, int.MaxValue)]
    public int? AssignedStudentId { get; set; }
    [Required, RegularExpression("^(Todo|InProgress|Done)$")]
    public string Status { get; set; } = "Todo";
}

public class TaskStatusInput
{
    [Required, RegularExpression("^(Todo|InProgress|Done)$")]
    public string Status { get; set; } = string.Empty;
}
