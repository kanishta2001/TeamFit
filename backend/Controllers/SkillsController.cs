using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.DTOs.Skills;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
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
        var skills = (await _context.Skills.AsNoTracking().OrderBy(skill => skill.Name).ToListAsync())
            .Where(skill => SkillCatalog.Contains(skill.Name)).Select(skill => new SkillResponse
            {
                Id = skill.Id, Name = SkillCatalog.CanonicalName(skill.Name),
                Categories = SkillCatalog.CategoriesFor(skill.Name)
            });

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

        return skill is null || !SkillCatalog.Contains(skill.Name) ? NotFound() : Ok(new SkillResponse
        {
            Id = skill.Id, Name = SkillCatalog.CanonicalName(skill.Name),
            Categories = SkillCatalog.CategoriesFor(skill.Name)
        });
    }
}
