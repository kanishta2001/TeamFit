using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class TeamInvitation
{
    public int Id { get; set; }
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    [MaxLength(20)]
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
