using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

// Register EF Core and configure it to use the local SQL Server database.
builder.Services.AddDbContext<TeamFitDbContext>(options =>
    options.UseSqlServer(connectionString));

// Register controller support so API requests can be handled by controller classes.
builder.Services.AddControllers();
// Allow the local Next.js frontend to call this API during development.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevelopment", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// Register Swagger services for browser-based API documentation and testing.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Enable Swagger only during development; it should not be publicly exposed in production by default.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Apply the CORS policy before requests reach controllers.
app.UseCors("FrontendDevelopment");
app.UseAuthorization();

// Map attribute-routed controllers, for example: GET /api/health.
app.MapControllers();

app.Run();
