using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class MilestonesController : ControllerBase
{
    private readonly MongoDbContext _context;
    public MilestonesController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<List<MilestoneDto>>> GetMilestones()
    {
        var milestones = await _context.Milestones.Find(_ => true).ToListAsync();
        var dtos = new List<MilestoneDto>();
        foreach (var m in milestones) dtos.Add(await MapToDtoAsync(m));
        return Ok(dtos);
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<MilestoneDto>>> GetByProject(string projectId)
    {
        var milestones = await _context.Milestones.Find(m => m.ProjectId == projectId).ToListAsync();
        var dtos = new List<MilestoneDto>();
        foreach (var m in milestones) dtos.Add(await MapToDtoAsync(m));
        return Ok(dtos);
    }

    [HttpPost]
    [RequirePermission("milestones", "CanCreate")]
    public async Task<ActionResult<MilestoneDto>> CreateMilestone([FromBody] ProgressMonitoringBackend.Domain.Entities.Milestone milestone)
    {
        await _context.Milestones.InsertOneAsync(milestone);
        return CreatedAtAction(nameof(GetMilestones), new { id = milestone.Id }, await MapToDtoAsync(milestone));
    }

    [HttpPut("{id}")]
    [RequirePermission("milestones", "CanEdit")]
    public async Task<IActionResult> UpdateMilestone(string id, [FromBody] ProgressMonitoringBackend.Domain.Entities.Milestone milestone)
    {
        milestone.Id = id;
        milestone.UpdatedAt = DateTime.UtcNow;
        await _context.Milestones.ReplaceOneAsync(m => m.Id == id, milestone);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RequirePermission("milestones", "CanDelete")]
    public async Task<IActionResult> DeleteMilestone(string id)
    {
        var result = await _context.Milestones.DeleteOneAsync(m => m.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }

    private async Task<MilestoneDto> MapToDtoAsync(ProgressMonitoringBackend.Domain.Entities.Milestone m)
    {
        var tasks = await _context.Tasks.Find(t => t.MilestoneId == m.Id).ToListAsync();
        return new MilestoneDto
        {
            Id = m.Id,
            Title = m.Title,
            Project = m.ProjectName,
            Description = m.Description,
            DueDate = m.DueDate.ToString("yyyy-MM-dd"),
            Status = m.Status,
            Completion = m.Progress,
            Tasks = new MilestoneTasksDto { Total = tasks.Count, Completed = tasks.Count(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.Done) },
            Assignees = new List<string>(),
            Priority = m.Priority.ToString().ToLower()
        };
    }
}
