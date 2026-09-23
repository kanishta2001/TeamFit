using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class Skill
{
    public int Id { get; set; }

    // A skill is a reusable item in the shared skills catalog, for example "React".
    [Required]
    [MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    // One skill can be connected to many students through the join table.
    public ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
}