using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;
    [Required, MinLength(10), MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;
    [Required, MaxLength(128)]
    public string Password { get; set; } = string.Empty;
}
