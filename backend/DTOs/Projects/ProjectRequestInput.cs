using System.ComponentModel.DataAnnotations;
using TeamFit.Api.Models;

namespace TeamFit.Api.DTOs.Projects;

// POST and PUT use the same complete project requirements.
public class ProjectRequestInput : IValidatableObject
{
    [Required, MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    [Range(2, 20)]
    public int TeamSize { get; set; } = 4;
    [Required, RegularExpression("^(Open|InProgress|Completed)$")]
    public string Status { get; set; } = "Open";
    [Required, MinLength(1), MaxLength(30)]
    public int[] RequiredSkillIds { get; set; } = [];
    [Required, MinLength(1), MaxLength(7)]
    public string[] DesiredRoles { get; set; } = [];
    [Required, MinLength(1), MaxLength(6)]
    public string[] Availability { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (RequiredSkillIds is not null && RequiredSkillIds.Any(id => id <= 0))
            yield return new ValidationResult("Skill IDs must be positive.", [nameof(RequiredSkillIds)]);
        if (DesiredRoles is not null && DesiredRoles.Any(role => !ProfileOptions.Roles.Contains(role)))
            yield return new ValidationResult("Select roles from the available options.", [nameof(DesiredRoles)]);
        if (Availability is not null && Availability.Any(slot => !ProfileOptions.AvailabilitySlots.Contains(slot)))
            yield return new ValidationResult("Select valid availability slots.", [nameof(Availability)]);
    }
}
