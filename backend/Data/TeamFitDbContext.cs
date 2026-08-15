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

    // These DbSets become the Skills and StudentSkills tables in SQL Server.
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // A university email should belong to only one student profile.
        modelBuilder.Entity<Student>()
            .HasIndex(student => student.UniversityEmail)
            .IsUnique();

                // A skill name should appear only once in the shared skills catalog.
        modelBuilder.Entity<Skill>()
            .HasIndex(skill => skill.Name)
            .IsUnique();

        // A student cannot have the same skill more than once.
        modelBuilder.Entity<StudentSkill>()
            .HasKey(studentSkill => new { studentSkill.StudentId, studentSkill.SkillId });

        modelBuilder.Entity<StudentSkill>()
            .HasOne(studentSkill => studentSkill.Student)
            .WithMany(student => student.StudentSkills)
            .HasForeignKey(studentSkill => studentSkill.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentSkill>()
            .HasOne(studentSkill => studentSkill.Skill)
            .WithMany(skill => skill.StudentSkills)
            .HasForeignKey(studentSkill => studentSkill.SkillId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
