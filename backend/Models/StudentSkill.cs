namespace TeamFit.Api.Models;

// This join entity connects one student profile with one skill.
public class StudentSkill
{
    public int StudentId { get; set; }

    public Student Student { get; set; } = null!;

    public int SkillId { get; set; }

    public Skill Skill { get; set; } = null!;
}