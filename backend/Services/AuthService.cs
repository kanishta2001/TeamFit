using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TeamFit.Api.Models;

namespace TeamFit.Api.Services;

public class AuthService(IConfiguration configuration)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(8);

    public string CreateToken(ApplicationUser user)
    {
        var key = configuration["Jwt:Key"]!;
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"] ?? "TeamFit",
            audience: configuration["Jwt:Audience"] ?? "TeamFit",
            claims: [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("version", user.TokenVersion.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: DateTime.UtcNow.Add(Lifetime),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
