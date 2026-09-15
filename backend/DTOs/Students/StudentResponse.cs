using TeamFit.Api.DTOs.Skills;

namespace TeamFit.Api.DTOs.Students;

public class StudentResponse
{
    public int Id { get; set; }
    public int? UserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string UniversityEmail { get; set; } = string.Empty;

    public string? Bio { get; set; }

    public string PreferredRole { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public List<SkillResponse> Skills { get; set; } = [];
    public List<string> Availability { get; set; } = [];
}
