using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TeamFit.Api.Data;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
var signingKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(signingKey) || Encoding.UTF8.GetByteCount(signingKey) < 32)
    throw new InvalidOperationException("Set Jwt:Key using dotnet user-secrets (at least 32 bytes). See README.");
var frontendOrigin = builder.Configuration["Frontend:Origin"] ?? "http://localhost:3000";

builder.Services.AddDbContext<TeamFitDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddHostedService<SkillCatalogSeeder>();
builder.Services.AddScoped<MatchingService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(frontendOrigin).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
        }));
});
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ClockSkew = TimeSpan.FromSeconds(30),
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "TeamFit",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "TeamFit",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = ctx =>
        {
            if (!ctx.Request.Headers.ContainsKey("Authorization"))
                ctx.Token = ctx.Request.Cookies["teamfit_session"];
            return Task.CompletedTask;
        },
        OnTokenValidated = async ctx =>
        {
            var db = ctx.HttpContext.RequestServices.GetRequiredService<TeamFitDbContext>();
            if (!int.TryParse(ctx.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ||
                !int.TryParse(ctx.Principal?.FindFirstValue("version"), out var version) ||
                !await db.Users.AnyAsync(x => x.Id == id && x.TokenVersion == version))
                ctx.Fail("Session has expired. Please sign in again.");
        }
    };
});
builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT",
        Description = "Sign in through /api/auth/login, then paste the returned token."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var app = builder.Build();
app.UseExceptionHandler(handler => handler.Run(async http =>
{
    var exception = http.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()?.Error;
    var sql = exception as SqlException ?? exception?.InnerException as SqlException;
    var status = sql?.Number is 2601 or 2627 or 547 or 1205 ? 409 : 500;
    http.Response.StatusCode = status;
    await http.Response.WriteAsJsonAsync(new
    {
        message = status == 409
            ? "This change conflicts with existing data. Refresh and try again."
            : "The server could not complete the request. Please try again."
    });
}));
app.UseCors("Frontend");
app.UseRateLimiter();
// HttpOnly + SameSite cookies protect sessions. Check origins for cookie-authenticated writes too.
app.Use(async (http, next) =>
{
    if (http.Request.Method is not ("GET" or "HEAD" or "OPTIONS") &&
        http.Request.Cookies.ContainsKey("teamfit_session") &&
        !http.Request.Headers.ContainsKey("Authorization"))
    {
        var origin = http.Request.Headers.Origin.ToString();
        var apiOrigin = $"{http.Request.Scheme}://{http.Request.Host}";
        if (origin != frontendOrigin && origin != apiOrigin)
        {
            http.Response.StatusCode = 403;
            await http.Response.WriteAsJsonAsync(new { message = "The request origin is not allowed." });
            return;
        }
    }
    await next();
});
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
