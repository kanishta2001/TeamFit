namespace TeamFit.Api.Models;

public class ProjectRequiredSkill
{
    public int ProjectRequestId { get; set; }
    public ProjectRequest ProjectRequest { get; set; } = null!;
    public int SkillId { get; set; }
    public Skill Skill { get; set; } = null!;
}
