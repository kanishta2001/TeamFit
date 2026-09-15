using TeamFit.Api.DTOs.Projects;
using TeamFit.Api.DTOs.Skills;
using TeamFit.Api.Models;

namespace TeamFit.Api.Services;

public class MatchingService
{
    // Pure rule-based scoring: no database writes, AI, or hidden weights.
    public RecommendationResponse Score(ProjectRequest project, Student student)
    {
        var required = project.RequiredSkills.Select(link => link.Skill).DistinctBy(skill => skill.Id).ToList();
        var studentSkillIds = student.StudentSkills.Select(link => link.SkillId).ToHashSet();
        var matched = required.Where(skill => studentSkillIds.Contains(skill.Id)).ToList();
        var roleMatched = project.DesiredRoles.Any(item =>
            string.Equals(item.Role, student.PreferredRole, StringComparison.OrdinalIgnoreCase));
        var shared = student.Availability.Select(item => item.Slot)
            .Intersect(project.Availability.Select(item => item.Slot)).Order().ToList();

        // Empty requirements earn no points; the project API requires at least one skill.
        var skillScore = required.Count == 0 ? 0 : Math.Round(60m * matched.Count / required.Count, 2);
        var roleScore = roleMatched ? 25 : 0;
        var availabilityScore = shared.Count > 0 ? 15 : 0;

        List<SkillResponse> Map(IEnumerable<Skill> skills) => skills.OrderBy(skill => skill.Name)
            .Select(skill => new SkillResponse { Id = skill.Id, Name = skill.Name }).ToList();

        return new RecommendationResponse
        {
            Student = ResponseMapper.Student(student),
            Score = skillScore + roleScore + availabilityScore,
            SkillScore = skillScore, RoleScore = roleScore, AvailabilityScore = availabilityScore,
            RequiredSkillCount = required.Count, RoleMatched = roleMatched,
            MatchedSkills = Map(matched),
            MissingSkills = Map(required.Where(skill => !studentSkillIds.Contains(skill.Id))),
            SharedAvailability = shared
        };
    }
}
