using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class StudentAvailability
{
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    [MaxLength(40)]
    public string Slot { get; set; } = string.Empty;
}
