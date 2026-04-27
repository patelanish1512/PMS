using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/progress-updates")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class ProgressUpdatesController : ControllerBase
{
    private readonly MongoDbContext _context;
    public ProgressUpdatesController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<List<object>>> GetAll()
    {
        var updates = await _context.ProgressUpdates.Find(_ => true).SortByDescending(u => u.UpdateDateTime).ToListAsync();
        return Ok(updates);
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<object>>> GetByProject(string projectId)
    {
        var updates = await _context.ProgressUpdates.Find(u => u.ProjectId == projectId).ToListAsync();
        return Ok(updates);
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<List<object>>> GetByTask(string taskId)
    {
        var updates = await _context.ProgressUpdates.Find(u => u.TaskId == taskId).ToListAsync();
        return Ok(updates);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Domain.Entities.ProgressUpdate update)
    {
        await _context.ProgressUpdates.InsertOneAsync(update);
        return Ok(update);
    }
}
