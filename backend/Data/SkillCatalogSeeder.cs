namespace TeamFit.Api.Data;

// A hosted service runs when the API starts, after EF design-time migration setup.
public sealed class SkillCatalogSeeder(IServiceScopeFactory scopes) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        await SkillCatalog.SeedAsync(scope.ServiceProvider.GetRequiredService<TeamFitDbContext>());
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
