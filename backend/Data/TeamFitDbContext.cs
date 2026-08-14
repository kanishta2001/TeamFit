using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Models;

namespace TeamFit.Api.Data;

public class TeamFitDbContext : DbContext
{
    public TeamFitDbContext(DbContextOptions<TeamFitDbContext> options)
        : base(options)
    {
    }

    // DbSet<Student> represents the Students table that EF Core will create in SQL Server.
    public DbSet<Student> Students => Set<Student>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // A university email should belong to only one student profile.
        modelBuilder.Entity<Student>()
            .HasIndex(student => student.UniversityEmail)
            .IsUnique();
    }
}
