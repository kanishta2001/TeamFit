using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectRole
{
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    [MaxLength(50)]
    public string Role { get; set; } = string.Empty;
}
