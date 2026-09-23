using TeamFit.Api.DTOs.Students;
using TeamFit.Api.DTOs.Skills;

namespace TeamFit.Api.DTOs.Projects;

public class RecommendationResponse
{
    public StudentResponse Student { get; set; } = new();
    public decimal Score { get; set; }
    public decimal SkillScore { get; set; }
    public int RoleScore { get; set; }
    public int AvailabilityScore { get; set; }
    public int RequiredSkillCount { get; set; }
    public List<SkillResponse> MatchedSkills { get; set; } = [];
    public List<SkillResponse> MissingSkills { get; set; } = [];
    public bool RoleMatched { get; set; }
    public List<string> SharedAvailability { get; set; } = [];
}
