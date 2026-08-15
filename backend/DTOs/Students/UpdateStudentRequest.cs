using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Students;

public class UpdateStudentRequest
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
}
