namespace TeamFit.Api.Models;

public class TeamMember
{
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
