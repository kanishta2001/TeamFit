var builder = WebApplication.CreateBuilder(args);

// Register controller support so API requests can be handled by controller classes.
builder.Services.AddControllers();
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

app.UseAuthorization();

// Map attribute-routed controllers, for example: GET /api/health.
app.MapControllers();

app.Run();
