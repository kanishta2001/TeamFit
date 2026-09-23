using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Students;
using TeamFit.Api.DTOs.Skills;
using TeamFit.Api.DTOs.StudentSkills;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;
using TeamFit.Api.Services;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/students")]
public class StudentsController(TeamFitDbContext context) : ControllerBase
{
    private IQueryable<Student> Profiles() => context.Students
        .Include(x => x.StudentSkills).ThenInclude(x => x.Skill)
        .Include(x => x.Availability).AsSplitQuery();

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentResponse>>> GetAll(
        string? search, string? role, int? skillId, string? availability)
    {
        var query = Profiles().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.FullName.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(x => x.PreferredRole == role);
        if (skillId.HasValue) query = query.Where(x => x.StudentSkills.Any(s => s.SkillId == skillId));
        if (!string.IsNullOrWhiteSpace(availability)) query = query.Where(x => x.Availability.Any(a => a.Slot == availability));
        var students = await query.OrderBy(x => x.FullName).ThenBy(x => x.Id).ToListAsync();
        return Ok(students.Select(ResponseMapper.Student));
    }

    [HttpGet("me")]
    public async Task<ActionResult<StudentResponse>> Me()
    {
        var student = await Profiles().AsNoTracking().SingleOrDefaultAsync(x => x.UserId == CurrentUser.Id(User));
        return student is null ? NotFound() : Ok(ResponseMapper.Student(student));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StudentResponse>> GetById(int id)
    {
        var student = await Profiles().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
        return student is null ? NotFound() : Ok(ResponseMapper.Student(student));
    }

    [HttpPost]
    [ProducesResponseType(typeof(StudentResponse), 201)]
    public async Task<ActionResult<StudentResponse>> Create(CreateStudentRequest request)
    {
        var userId = CurrentUser.Id(User);
        var user = await context.Users.FindAsync(userId);
        if (!string.Equals(request.UniversityEmail.Trim(), user!.Email, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Use the email of your signed-in account." });
        if (await context.Students.AnyAsync(x => x.UserId == userId || x.UniversityEmail == user.Email))
            return Conflict(new { message = "This account or email already has a student profile." });
        if (!await ValidSkills(request.SkillIds)) return BadRequest(new { message = "Choose skills from the predefined catalog." });

        var student = new Student { UserId = userId, UniversityEmail = user.Email };
        Apply(student, request);
        context.Students.Add(student);
        await context.SaveChangesAsync();
        var saved = await Profiles().SingleAsync(x => x.Id == student.Id);
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, ResponseMapper.Student(saved));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<StudentResponse>> Update(int id, UpdateStudentRequest request)
    {
        var student = await Profiles().SingleOrDefaultAsync(x => x.Id == id);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        if (!string.Equals(request.UniversityEmail.Trim(), student.UniversityEmail, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Your account email cannot be changed from the profile form." });
        if (!await ValidSkills(request.SkillIds, student.StudentSkills.Select(link => link.SkillId).ToHashSet()))
            return BadRequest(new { message = "Choose skills from the predefined catalog." });
        Apply(student, request);
        await context.SaveChangesAsync();
        // Load navigation values for newly assigned skills before creating the response.
        context.ChangeTracker.Clear();
        return Ok(ResponseMapper.Student(await Profiles().SingleAsync(x => x.Id == id)));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var student = await context.Students.FindAsync(id);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        if (await context.TeamMembers.AnyAsync(x => x.StudentId == id))
            return Conflict(new { message = "Leave your teams and delete projects you own before deleting your profile." });
        context.Students.Remove(student);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{studentId:int}/skills")]
    public async Task<IActionResult> GetSkills(int studentId)
    {
        if (!await context.Students.AnyAsync(x => x.Id == studentId)) return NotFound();
        var skills = await context.StudentSkills.AsNoTracking().Where(x => x.StudentId == studentId)
            .OrderBy(x => x.Skill.Name).Select(x => new { x.SkillId, x.Skill.Name }).ToListAsync();
        return Ok(skills.Select(skill => new SkillResponse
        {
            Id = skill.SkillId, Name = SkillCatalog.CanonicalName(skill.Name),
            Categories = SkillCatalog.CategoriesFor(skill.Name)
        }));
    }

    [HttpPost("{studentId:int}/skills")]
    public async Task<IActionResult> AssignSkill(int studentId, AssignSkillRequest request)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        var skill = await context.Skills.FindAsync(request.SkillId);
        if (skill is null || !SkillCatalog.Contains(skill.Name))
            return BadRequest(new { message = "Choose a skill from the predefined catalog." });
        if (await context.StudentSkills.AnyAsync(x => x.StudentId == studentId && x.SkillId == request.SkillId))
            return Conflict(new { message = "This skill is already assigned to the student." });
        if (await context.StudentSkills.CountAsync(x => x.StudentId == studentId) >= 30)
            return BadRequest(new { message = "A profile can have at most 30 skills." });
        context.StudentSkills.Add(new StudentSkill { StudentId = studentId, SkillId = skill.Id });
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSkills), new { studentId }, new SkillResponse
        {
            Id = skill.Id, Name = SkillCatalog.CanonicalName(skill.Name),
            Categories = SkillCatalog.CategoriesFor(skill.Name)
        });
    }

    [HttpDelete("{studentId:int}/skills/{skillId:int}")]
    public async Task<IActionResult> RemoveSkill(int studentId, int skillId)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        var link = await context.StudentSkills.FindAsync(studentId, skillId);
        if (link is null) return NotFound();
        context.StudentSkills.Remove(link);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> ValidSkills(int[]? ids, HashSet<int>? previouslyAssigned = null)
    {
        if (ids is null) return true;
        var found = await context.Skills.Where(skill => ids.Contains(skill.Id))
            .Select(skill => new { skill.Id, skill.Name }).ToListAsync();
        // Existing non-catalog IDs may remain on this profile, but cannot be newly assigned.
        return found.Count == ids.Distinct().Count() &&
            found.All(skill => SkillCatalog.Contains(skill.Name) || previouslyAssigned?.Contains(skill.Id) == true);
    }

    private static void Apply(Student student, CreateStudentRequest request)
    {
        student.FullName = request.FullName.Trim();
        student.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        student.PreferredRole = request.PreferredRole;
        // Replace only changed links; keeping existing keys avoids duplicate tracking conflicts.
        if (request.SkillIds is not null)
        {
            var wanted = request.SkillIds.ToHashSet();
            foreach (var link in student.StudentSkills.Where(x => !wanted.Contains(x.SkillId)).ToList())
                student.StudentSkills.Remove(link);
            foreach (var id in wanted.Where(id => !student.StudentSkills.Any(x => x.SkillId == id)))
                student.StudentSkills.Add(new StudentSkill { SkillId = id });
        }
        if (request.Availability is not null)
        {
            var wanted = request.Availability.ToHashSet();
            foreach (var item in student.Availability.Where(x => !wanted.Contains(x.Slot)).ToList())
                student.Availability.Remove(item);
            foreach (var slot in wanted.Where(slot => !student.Availability.Any(x => x.Slot == slot)))
                student.Availability.Add(new StudentAvailability { Slot = slot });
        }
    }
}
