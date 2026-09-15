using System.ComponentModel.DataAnnotations;
using TeamFit.Api.Models;

namespace TeamFit.Api.DTOs.Students;

public class CreateStudentRequest : IValidatableObject
{
    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string UniversityEmail { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Bio { get; set; }

    [Required]
    [MaxLength(50)]
    public string PreferredRole { get; set; } = string.Empty;

    // Omitted collections preserve existing assignments on profile updates.
    [MaxLength(30)]
    public int[]? SkillIds { get; set; }
    [MaxLength(6)]
    public string[]? Availability { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!ProfileOptions.Roles.Contains(PreferredRole))
            yield return new ValidationResult("Select a valid project role.", [nameof(PreferredRole)]);
        if (SkillIds is not null && SkillIds.Any(id => id <= 0))
            yield return new ValidationResult("Skill IDs must be positive.", [nameof(SkillIds)]);
        if (Availability is not null && Availability.Any(slot => !ProfileOptions.AvailabilitySlots.Contains(slot)))
            yield return new ValidationResult("Select valid availability slots.", [nameof(Availability)]);
    }
}
