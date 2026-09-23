using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Models;

namespace TeamFit.Api.Data;

public class TeamFitDbContext(DbContextOptions<TeamFitDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentPhoto> StudentPhotos => Set<StudentPhoto>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();
    public DbSet<StudentAvailability> StudentAvailability => Set<StudentAvailability>();
    public DbSet<ProjectRequest> Projects => Set<ProjectRequest>();
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<TeamInvitation> Invitations => Set<TeamInvitation>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<ProjectTaskAssignment> ProjectTaskAssignments => Set<ProjectTaskAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<StudentPhoto>().HasOne(x => x.Student).WithOne()
            .HasForeignKey<StudentPhoto>(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectTask>().HasOne(x => x.ProjectRequest).WithMany(x => x.Tasks)
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectTaskAssignment>().HasIndex(x => new { x.ProjectTaskId, x.StudentId }).IsUnique();
        modelBuilder.Entity<ProjectTaskAssignment>().HasOne(x => x.ProjectTask).WithMany(x => x.Assignments)
            .HasForeignKey(x => x.ProjectTaskId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectTaskAssignment>().HasOne(x => x.Student).WithMany()
            .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Student>().HasIndex(x => x.UniversityEmail).IsUnique();
        modelBuilder.Entity<Skill>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<ApplicationUser>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Student>().HasIndex(x => x.UserId).IsUnique().HasFilter("[UserId] IS NOT NULL");
        modelBuilder.Entity<Student>().HasOne(x => x.User).WithOne().HasForeignKey<Student>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StudentSkill>().HasKey(x => new { x.StudentId, x.SkillId });
        modelBuilder.Entity<StudentSkill>().HasOne(x => x.Student).WithMany(x => x.StudentSkills)
            .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<StudentSkill>().HasOne(x => x.Skill).WithMany(x => x.StudentSkills)
            .HasForeignKey(x => x.SkillId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<StudentAvailability>().HasKey(x => new { x.StudentId, x.Slot });
        modelBuilder.Entity<StudentAvailability>().HasOne(x => x.Student).WithMany(x => x.Availability)
            .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProjectRequest>().HasOne(x => x.Owner).WithMany()
            .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProjectRequiredSkill>().HasKey(x => new { x.ProjectRequestId, x.SkillId });
        modelBuilder.Entity<ProjectRequiredSkill>().HasOne(x => x.ProjectRequest).WithMany(x => x.RequiredSkills)
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectRequiredSkill>().HasOne(x => x.Skill).WithMany()
            .HasForeignKey(x => x.SkillId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ProjectRole>().HasKey(x => new { x.ProjectRequestId, x.Role });
        modelBuilder.Entity<ProjectRole>().HasOne(x => x.ProjectRequest).WithMany(x => x.DesiredRoles)
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ProjectAvailability>().HasKey(x => new { x.ProjectRequestId, x.Slot });
        modelBuilder.Entity<ProjectAvailability>().HasOne(x => x.ProjectRequest).WithMany(x => x.Availability)
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TeamMember>().HasKey(x => new { x.ProjectRequestId, x.StudentId });
        modelBuilder.Entity<TeamMember>().HasOne(x => x.ProjectRequest).WithMany(x => x.Members)
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TeamMember>().HasOne(x => x.Student).WithMany()
            .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<TeamInvitation>().HasIndex(x => new { x.ProjectRequestId, x.StudentId }).IsUnique();
        modelBuilder.Entity<TeamInvitation>().HasOne(x => x.ProjectRequest).WithMany()
            .HasForeignKey(x => x.ProjectRequestId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TeamInvitation>().HasOne(x => x.Student).WithMany()
            .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
    }
}
