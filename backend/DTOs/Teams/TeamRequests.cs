using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Teams;

public class InviteStudentRequest
{
    [Range(1, int.MaxValue)]
    public int StudentId { get; set; }
}

public class InvitationDecision
{
    [Required, RegularExpression("^(Accepted|Rejected)$")]
    public string Status { get; set; } = string.Empty;
}

public class InvitationInboxItem
{
    public int Id { get; set; }
    public string Kind { get; set; } = "Project";
    public int ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ProjectStatus { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public DateTime? DeadlineAt { get; set; }
}
