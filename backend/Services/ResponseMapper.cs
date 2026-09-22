using TeamFit.Api.DTOs.Students;
using TeamFit.Api.DTOs.Projects;
using TeamFit.Api.DTOs.Skills;
using TeamFit.Api.Data;
using TeamFit.Api.Models;

namespace TeamFit.Api.Services;

public static class ResponseMapper
{
    // Call these after loading the related skills and availability.
    public static StudentResponse Student(Student student) => new()
    {
        Id = student.Id, UserId = student.UserId, FullName = student.FullName,
        UniversityEmail = student.UniversityEmail, Bio = student.Bio,
        PreferredRole = student.PreferredRole, CreatedAt = student.CreatedAt,
        Skills = student.StudentSkills.OrderBy(link => link.Skill.Name)
            .Select(link => new SkillResponse { Id = link.SkillId, Name = SkillCatalog.CanonicalName(link.Skill.Name),
                Categories = SkillCatalog.CategoriesFor(link.Skill.Name) }).ToList(),
        Availability = student.Availability.Select(item => item.Slot).Order().ToList()
    };

    public static ProjectResponse Project(ProjectRequest project) => new()
    {
        Id = project.Id, OwnerId = project.OwnerId, Status = project.Status,
        MemberCount = project.Members.Count, Title = project.Title, Description = project.Description,
        TeamSize = project.TeamSize, CreatedAt = project.CreatedAt,
        TaskCount = project.Tasks.Count,
        CompletedTaskCount = project.Tasks.Count(task => task.Status == "Done"),
        ProgressPercent = project.Tasks.Count == 0 ? 0 :
            (int)Math.Round(100m * project.Tasks.Count(task => task.Status == "Done") / project.Tasks.Count),
        RequiredSkills = project.RequiredSkills.OrderBy(link => link.Skill.Name)
            .Select(link => new SkillResponse { Id = link.SkillId, Name = SkillCatalog.CanonicalName(link.Skill.Name),
                Categories = SkillCatalog.CategoriesFor(link.Skill.Name) }).ToList(),
        DesiredRoles = project.DesiredRoles.Select(item => item.Role).Order().ToList(),
        Availability = project.Availability.Select(item => item.Slot).Order().ToList()
    };
}
