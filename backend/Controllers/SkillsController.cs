using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Skills;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
    private readonly TeamFitDbContext _context;

    public SkillsController(TeamFitDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SkillResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SkillResponse>>> GetAll()
    {
        // Read-only queries do not need EF Core change tracking.
        var skills = await _context.Skills
            .AsNoTracking()
            .OrderBy(skill => skill.Name)
            .Select(skill => ToResponse(skill))
            .ToListAsync();

        return Ok(skills);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SkillResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SkillResponse>> GetById(int id)
    {
        var skill = await _context.Skills
            .AsNoTracking()
            .FirstOrDefaultAsync(skill => skill.Id == id);

        return skill is null ? NotFound() : Ok(ToResponse(skill));
    }

    [HttpPost]
    [ProducesResponseType(typeof(SkillResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SkillResponse>> Create(CreateSkillRequest request)
    {
        var skillName = request.Name.Trim();

        if (await SkillNameAlreadyExists(skillName))
        {
            return Conflict(new { message = "This skill already exists in the catalog." });
        }

        var skill = new Skill
        {
            Name = skillName
        };

        _context.Skills.Add(skill);
        await _context.SaveChangesAsync();

        var response = ToResponse(skill);
        return CreatedAtAction(nameof(GetById), new { id = skill.Id }, response);
    }

    private async Task<bool> SkillNameAlreadyExists(string name)
    {
        return await _context.Skills.AnyAsync(skill => skill.Name == name);
    }

    // DTOs define the API response instead of exposing the database entity directly.
    private static SkillResponse ToResponse(Skill skill)
    {
        return new SkillResponse
        {
            Id = skill.Id,
            Name = skill.Name
        };
    }
}