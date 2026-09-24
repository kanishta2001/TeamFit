using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectMessage
{
    public int Id { get; set; }
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    public int SenderUserId { get; set; }
    public ApplicationUser SenderUser { get; set; } = null!;
    [MaxLength(1000)]
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
