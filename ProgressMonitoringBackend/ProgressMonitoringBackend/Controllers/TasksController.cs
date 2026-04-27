using Microsoft.AspNetCore.Mvc;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class TasksController : ControllerBase
{
    private readonly MongoDbContext _context;

    public TasksController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("tasks", "CanView")]
    public async Task<ActionResult<List<TaskDto>>> GetTasks()
    {
        FilterDefinition<ProgressMonitoringBackend.Domain.Entities.TaskItem> filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.Empty;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (User.IsInRole("ProjectManager"))
        {
            var managedProjectIds = (await _context.Projects.Find(p => p.ManagerId == userId).ToListAsync()).Select(p => p.Id).ToList();
            filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.In(t => t.ProjectId, managedProjectIds);
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
            }
        }

        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        return Ok(tasks.Select(MapToDto).ToList());
    }

    [HttpGet("assigned")]
    [RequirePermission("tasks", "CanView")]
    public async Task<ActionResult<List<TaskDto>>> GetAssignedTasks()
    {
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
        if (user == null) return NotFound();

        var filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        return Ok(tasks.Select(MapToDto).ToList());
    }

    [HttpGet("board")]
    [RequirePermission("tasks", "CanView")]
    public async Task<ActionResult<Dictionary<string, List<TaskDto>>>> GetBoard()
    {
        FilterDefinition<ProgressMonitoringBackend.Domain.Entities.TaskItem> filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.Empty;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (User.IsInRole("ProjectManager"))
        {
            var managedProjectIds = (await _context.Projects.Find(p => p.ManagerId == userId).ToListAsync()).Select(p => p.Id).ToList();
            filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.In(t => t.ProjectId, managedProjectIds);
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                filter = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, user.FullName);
            }
        }

        var tasks = await _context.Tasks.Find(filter).ToListAsync();
        var board = new Dictionary<string, List<TaskDto>>
        {
            { "todo", tasks.Where(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.ToDo).Select(MapToDto).ToList() },
            { "in-progress", tasks.Where(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.InProgress).Select(MapToDto).ToList() },
            { "blocked", tasks.Where(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.Blocked).Select(MapToDto).ToList() },
            { "done", tasks.Where(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.Done).Select(MapToDto).ToList() }
        };

        return Ok(board);
    }

    [HttpGet("project/{projectId}")]
    [RequirePermission("tasks", "CanView")]
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
    [RequirePermission("tasks", "CanCreate")]
    public async Task<IActionResult> CreateTask([FromBody] ProgressMonitoringBackend.Domain.Entities.TaskItem task)
    {
        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var project = await _context.Projects.Find(p => p.Id == task.ProjectId).FirstOrDefaultAsync();
            if (project == null || project.ManagerId != userId) return Forbid();
        }

        task.CreatedAt = DateTime.UtcNow;
        await _context.Tasks.InsertOneAsync(task);
        return Ok(MapToDto(task));
    }

    [HttpPut("{id}")]
    [RequirePermission("tasks", "CanEdit")]
    public async Task<IActionResult> UpdateTask(string id, [FromBody] ProgressMonitoringBackend.Domain.Entities.TaskItem task)
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
    [RequirePermission("tasks", "CanEdit")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] string status)
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

        var taskStatus = Enum.TryParse<ProgressMonitoringBackend.Domain.Enums.TaskStatus>(status.Replace("-", ""), true, out var result) ? result : ProgressMonitoringBackend.Domain.Enums.TaskStatus.ToDo;
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.TaskItem>.Update
            .Set(t => t.Status, taskStatus)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);
        await _context.Tasks.UpdateOneAsync(t => t.Id == id, update);
        return Ok();
    }

    [HttpDelete("{id}")]
    [RequirePermission("tasks", "CanDelete")]
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

    private TaskDto MapToDto(ProgressMonitoringBackend.Domain.Entities.TaskItem task)
    {
        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            Project = task.ProjectName,
            Status = task.Status.ToString().ToLower().Replace("inprogress", "in-progress"),
            Priority = task.Priority.ToString().ToLower(),
            DueDate = task.EndDate.ToString("yyyy-MM-dd"),
            Assignees = task.AssigneeNames,
            Comments = 0,
            Attachments = 0
        };
    }
}
