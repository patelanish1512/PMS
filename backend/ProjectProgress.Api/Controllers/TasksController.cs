using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;
using TaskStatus = ProjectProgress.Domain.Enums.TaskStatus;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class TasksController : ControllerBase
{

    private readonly MongoDbContext _context;
    public TasksController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetTasks()
    {
        FilterDefinition<Domain.Entities.TaskItem> filter = Builders<Domain.Entities.TaskItem>.Filter.Empty;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (User.IsInRole("ProjectManager"))
        {
            var managedProjectIds = (await _context.Projects.Find(p => p.ManagerId == userId).ToListAsync()).Select(p => p.Id).ToList();
            filter = Builders<Domain.Entities.TaskItem>.Filter.In(t => t.ProjectId, managedProjectIds);
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                filter = Builders<Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
            }
        }

        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        return Ok(tasks.Select(MapToDto).ToList());
    }

    [HttpGet("assigned")]
    public async Task<ActionResult<List<TaskDto>>> GetAssignedTasks()
    {
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
        if (user == null) return NotFound();

        var filter = Builders<Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        return Ok(tasks.Select(MapToDto).ToList());
    }

    [HttpGet("board")]
    public async Task<ActionResult<object>> GetBoard()
    {
        FilterDefinition<Domain.Entities.TaskItem> filter = Builders<Domain.Entities.TaskItem>.Filter.Empty;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (User.IsInRole("ProjectManager"))
        {
            var managedProjectIds = (await _context.Projects.Find(p => p.ManagerId == userId).ToListAsync()).Select(p => p.Id).ToList();
            filter = Builders<Domain.Entities.TaskItem>.Filter.In(t => t.ProjectId, managedProjectIds);
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                filter = Builders<Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
            }
        }

        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        var board = new Dictionary<string, List<TaskDto>>
        {
            ["todo"] = tasks.Where(t => t.Status == TaskStatus.ToDo).Select(MapToDto).ToList(),
            ["in-progress"] = tasks.Where(t => t.Status == TaskStatus.InProgress).Select(MapToDto).ToList(),
            ["blocked"] = tasks.Where(t => t.Status == TaskStatus.Blocked).Select(MapToDto).ToList(),
            ["done"] = tasks.Where(t => t.Status == TaskStatus.Done).Select(MapToDto).ToList()
        };
        return Ok(board);
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<TaskDto>>> GetByProject(string projectId)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (User.IsInRole("ProjectManager"))
        {
            var project = await _context.Projects.Find(p => p.Id == projectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }

        var tasks = await _context.Tasks.Find(t => t.ProjectId == projectId).ToListAsync();

        if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                tasks = tasks.Where(t => t.AssigneeNames != null && t.AssigneeNames.Contains(user.FullName)).ToList();
            }
        }

        return Ok(tasks.Select(MapToDto).ToList());
    }

    [HttpPost]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] Domain.Entities.TaskItem task)
    {
        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var project = await _context.Projects.Find(p => p.Id == task.ProjectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }

        await _context.Tasks.InsertOneAsync(task);
        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, MapToDto(task));
    }

    [HttpPut("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] Domain.Entities.TaskItem task)
    {
        var existing = await _context.Tasks.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var project = await _context.Projects.Find(p => p.Id == existing.ProjectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }

        task.Id = id;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.Tasks.ReplaceOneAsync(t => t.Id == id, task);
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,ProjectManager,Member")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] StatusUpdateDto dto)
    {
        var existing = await _context.Tasks.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (User.IsInRole("ProjectManager"))
        {
            var project = await _context.Projects.Find(p => p.Id == existing.ProjectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user == null || existing.AssigneeNames == null || !existing.AssigneeNames.Contains(user.FullName)) 
                return Forbid();
        }

        TaskStatus status;
        switch (dto.Status?.ToLower())
        {
            case "todo": status = TaskStatus.ToDo; break;
            case "in-progress": status = TaskStatus.InProgress; break;
            case "blocked": status = TaskStatus.Blocked; break;
            case "done": status = TaskStatus.Done; break;
            default: return BadRequest("Invalid status");
        }
        var update = Builders<Domain.Entities.TaskItem>.Update
            .Set(t => t.Status, status)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);
        var result = await _context.Tasks.UpdateOneAsync(t => t.Id == id, update);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin,ProjectManager")]
    public async Task<IActionResult> DeleteTask(string id)
    {
        var existing = await _context.Tasks.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var project = await _context.Projects.Find(p => p.Id == existing.ProjectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }

        await _context.Tasks.DeleteOneAsync(t => t.Id == id);
        return NoContent();
    }


    private static TaskDto MapToDto(Domain.Entities.TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Project = t.ProjectName,
        Assignee = new AssigneeDto
        {
            Name = t.AssigneeNames.FirstOrDefault() ?? "",
            Avatar = t.AssigneeNames.FirstOrDefault()?.Split(' ').Select(n => n[0]).Aggregate("", (a, b) => a + b) ?? ""
        },
        Priority = t.Priority.ToString().ToLower(),
        DueDate = t.EndDate.ToString("yyyy-MM-dd"),
        Attachments = 0,
        Comments = 0
    };
}

public class StatusUpdateDto
{
    public string? Status { get; set; }
}
