using TeamFit.Api.DTOs.Skills;

namespace TeamFit.Api.DTOs.Projects;

public class ProjectResponse
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Status { get; set; } = "Open";
    public int MemberCount { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TeamSize { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SkillResponse> RequiredSkills { get; set; } = [];
    public List<string> DesiredRoles { get; set; } = [];
    public List<string> Availability { get; set; } = [];
}
