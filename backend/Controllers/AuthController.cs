using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Auth;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;
using TeamFit.Api.Services;

namespace TeamFit.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(TeamFitDbContext context, AuthService auth, IHostEnvironment environment) : ControllerBase
{
    private readonly PasswordHasher<ApplicationUser> _hasher = new();

    [AllowAnonymous, HttpPost("register"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await context.Users.AnyAsync(x => x.Email == email) ||
            await context.Students.AnyAsync(x => x.UniversityEmail == email))
            return Conflict(new { message = "This email is already registered or belongs to an existing profile." });

        var user = new ApplicationUser { Email = email };
        // PasswordHasher uses a salted, work-factored hash; passwords are never stored as text.
        user.PasswordHash = _hasher.HashPassword(user, request.Password);
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return StatusCode(201, SignIn(user));
    }

    [AllowAnonymous, HttpPost("login"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await context.Users.SingleOrDefaultAsync(x => x.Email == email);
        if (user is null || _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password)
            == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "The email or password is incorrect." });
        return Ok(SignIn(user));
    }

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await context.Users.FindAsync(CurrentUser.Id(User));
        return Ok(new { id = user!.Id, email = user.Email });
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // Revoke previously issued tokens, including copied bearer tokens.
        await context.Users.Where(x => x.Id == CurrentUser.Id(User))
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.TokenVersion, x => x.TokenVersion + 1));
        Response.Cookies.Delete("teamfit_session", CookieSettings());
        return NoContent();
    }

    private object SignIn(ApplicationUser user)
    {
        var token = auth.CreateToken(user);
        Response.Cookies.Append("teamfit_session", token, CookieSettings());
        // Swagger/REST clients can use this token; the web app relies on the HttpOnly cookie.
        return new { user = new { id = user.Id, email = user.Email }, token,
            expiresAt = DateTime.UtcNow.Add(AuthService.Lifetime) };
    }

    private CookieOptions CookieSettings() => new()
    {
        HttpOnly = true, Secure = !environment.IsDevelopment(), SameSite = SameSiteMode.Strict,
        Path = "/", MaxAge = AuthService.Lifetime
    };
}
