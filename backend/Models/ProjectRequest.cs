using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ProjectRequest
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public ApplicationUser Owner { get; set; } = null!;
    [MaxLength(20)]
    public string Status { get; set; } = "Open";
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    public int TeamSize { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProjectRequiredSkill> RequiredSkills { get; set; } = new List<ProjectRequiredSkill>();
    public ICollection<ProjectRole> DesiredRoles { get; set; } = new List<ProjectRole>();
    public ICollection<ProjectAvailability> Availability { get; set; } = new List<ProjectAvailability>();
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
}
