using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectAvailability
{
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    [MaxLength(40)]
    public string Slot { get; set; } = string.Empty;
}
