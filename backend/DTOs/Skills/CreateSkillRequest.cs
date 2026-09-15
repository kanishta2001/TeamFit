using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Skills;

public class CreateSkillRequest
{
    [Required]
    [MaxLength(80)]
    public string Name { get; set; } = string.Empty;
}