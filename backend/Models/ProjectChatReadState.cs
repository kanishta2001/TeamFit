namespace TeamFit.Api.Models;

public class ProjectChatReadState
{
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
}
