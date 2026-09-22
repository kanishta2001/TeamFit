namespace TeamFit.Api.DTOs.Skills;

public class SkillResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string[] Categories { get; set; } = [];
}
