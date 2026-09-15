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
