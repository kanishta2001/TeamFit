using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

public class ApplicationUser
{
    public int Id { get; set; }
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int TokenVersion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
