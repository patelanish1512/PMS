using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MilestonesController : ControllerBase
{
    private readonly MongoDbContext _context;
    public MilestonesController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<List<MilestoneDto>>> GetMilestones()
    {
        var milestones = await _context.Milestones.Find(_ => true).ToListAsync();
        return Ok(milestones.Select(MapToDto).ToList());
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<MilestoneDto>>> GetByProject(string projectId)
    {
        var milestones = await _context.Milestones.Find(m => m.ProjectId == projectId).ToListAsync();
        return Ok(milestones.Select(MapToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<MilestoneDto>> CreateMilestone([FromBody] Domain.Entities.Milestone milestone)
    {
        await _context.Milestones.InsertOneAsync(milestone);
        return CreatedAtAction(nameof(GetMilestones), new { id = milestone.Id }, MapToDto(milestone));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMilestone(string id, [FromBody] Domain.Entities.Milestone milestone)
    {
        milestone.Id = id;
        milestone.UpdatedAt = DateTime.UtcNow;
        await _context.Milestones.ReplaceOneAsync(m => m.Id == id, milestone);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMilestone(string id)
    {
        var result = await _context.Milestones.DeleteOneAsync(m => m.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }

    private static MilestoneDto MapToDto(Domain.Entities.Milestone m) => new()
    {
        Id = m.Id,
        Title = m.Title,
        Project = m.ProjectName,
        Description = m.Description,
        DueDate = m.DueDate.ToString("yyyy-MM-dd"),
        Status = m.Status,
        Completion = m.Progress,
        Tasks = new MilestoneTasksDto { Total = 0, Completed = 0 },
        Assignees = new List<string>(),
        Priority = m.Priority.ToString().ToLower()
    };
}
