using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Students;
using TeamFit.Api.DTOs.Skills;
using TeamFit.Api.DTOs.StudentSkills;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly TeamFitDbContext _context;

    public StudentsController(TeamFitDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<StudentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StudentResponse>>> GetAll()
    {
        // Read-only queries do not need EF Core change tracking.
        var students = await _context.Students
            .AsNoTracking()
            .OrderBy(student => student.FullName)
            .Select(student => ToResponse(student))
            .ToListAsync();

        return Ok(students);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(StudentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StudentResponse>> GetById(int id)
    {
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(student => student.Id == id);

        return student is null ? NotFound() : Ok(ToResponse(student));
    }

    [HttpPost]
    [ProducesResponseType(typeof(StudentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentResponse>> Create(CreateStudentRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.UniversityEmail);

        if (await EmailAlreadyExists(normalizedEmail))
        {
            return Conflict(new { message = "A student profile already uses this university email." });
        }

        var student = new Student
        {
            FullName = request.FullName.Trim(),
            UniversityEmail = normalizedEmail,
            Bio = NormalizeOptionalText(request.Bio),
            PreferredRole = request.PreferredRole.Trim()
        };

        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        var response = ToResponse(student);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, response);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(StudentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentResponse>> Update(int id, UpdateStudentRequest request)
    {
        var student = await _context.Students.FindAsync(id);

        if (student is null)
        {
            return NotFound();
        }

        var normalizedEmail = NormalizeEmail(request.UniversityEmail);

        if (await EmailAlreadyExists(normalizedEmail, id))
        {
            return Conflict(new { message = "A student profile already uses this university email." });
        }

        student.FullName = request.FullName.Trim();
        student.UniversityEmail = normalizedEmail;
        student.Bio = NormalizeOptionalText(request.Bio);
        student.PreferredRole = request.PreferredRole.Trim();

        await _context.SaveChangesAsync();
        return Ok(ToResponse(student));
    }
    [HttpGet("{studentId:int}/skills")]
    [ProducesResponseType(typeof(IEnumerable<SkillResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<SkillResponse>>> GetSkills(int studentId)
    {
        var studentExists = await _context.Students
            .AnyAsync(student => student.Id == studentId);

        if (!studentExists)
        {
            return NotFound(new { message = "Student profile was not found." });
        }

        // Read the skills linked to this student through the StudentSkills join table.
        var skills = await _context.StudentSkills
            .AsNoTracking()
            .Where(studentSkill => studentSkill.StudentId == studentId)
            .OrderBy(studentSkill => studentSkill.Skill.Name)
            .Select(studentSkill => new SkillResponse
            {
                Id = studentSkill.Skill.Id,
                Name = studentSkill.Skill.Name
            })
            .ToListAsync();

        return Ok(skills);
    }

    [HttpPost("{studentId:int}/skills")]
    [ProducesResponseType(typeof(SkillResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SkillResponse>> AssignSkill(
        int studentId,
        AssignSkillRequest request)
    {
        var studentExists = await _context.Students
            .AnyAsync(student => student.Id == studentId);

        if (!studentExists)
        {
            return NotFound(new { message = "Student profile was not found." });
        }

        var skill = await _context.Skills.FindAsync(request.SkillId);

        if (skill is null)
        {
            return NotFound(new { message = "Skill was not found." });
        }

        var assignmentExists = await _context.StudentSkills
            .AnyAsync(studentSkill =>
                studentSkill.StudentId == studentId &&
                studentSkill.SkillId == request.SkillId);

        if (assignmentExists)
        {
            return Conflict(new { message = "This skill is already assigned to the student." });
        }

        var studentSkill = new StudentSkill
        {
            StudentId = studentId,
            SkillId = request.SkillId
        };

        _context.StudentSkills.Add(studentSkill);
        await _context.SaveChangesAsync();

        var response = new SkillResponse
        {
            Id = skill.Id,
            Name = skill.Name
        };

        return CreatedAtAction(nameof(GetSkills), new { studentId }, response);
    }

    [HttpDelete("{studentId:int}/skills/{skillId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveSkill(int studentId, int skillId)
    {
        var studentSkill = await _context.StudentSkills
            .FirstOrDefaultAsync(assignment =>
                assignment.StudentId == studentId &&
                assignment.SkillId == skillId);

        if (studentSkill is null)
        {
            return NotFound(new { message = "This skill assignment was not found." });
        }

        _context.StudentSkills.Remove(studentSkill);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var student = await _context.Students.FindAsync(id);

        if (student is null)
        {
            return NotFound();
        }

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> EmailAlreadyExists(string email, int? studentIdToExclude = null)
    {
        return await _context.Students.AnyAsync(student =>
            student.UniversityEmail == email && student.Id != studentIdToExclude);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string? NormalizeOptionalText(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    // DTOs define the API response instead of exposing the database entity directly.
    private static StudentResponse ToResponse(Student student)
    {
        return new StudentResponse
        {
            Id = student.Id,
            FullName = student.FullName,
            UniversityEmail = student.UniversityEmail,
            Bio = student.Bio,
            PreferredRole = student.PreferredRole,
            CreatedAt = student.CreatedAt
        };
    }
}
