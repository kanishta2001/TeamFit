using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.StudentSkills;

public class AssignSkillRequest
{
    [Range(1, int.MaxValue)]
    public int SkillId { get; set; }
}