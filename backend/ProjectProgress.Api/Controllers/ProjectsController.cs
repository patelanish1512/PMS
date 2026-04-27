using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Application.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ProjectProgress.Infrastructure.Mongo.MongoDbContext _context;

    public ProjectsController(IProjectService projectService, ProjectProgress.Infrastructure.Mongo.MongoDbContext context)
    {
        _projectService = projectService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetProjects()
    {
        var projects = await _projectService.GetAllProjectsAsync();
        
        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            projects = projects.Where(p => p.ManagerId == userId).ToList();
        }
        else if (User.IsInRole("Member"))
        {
            var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
            if (user != null)
            {
                var assignedTasks = await _context.Tasks.Find(t => t.AssigneeNames != null && t.AssigneeNames.Contains(user.FullName)).ToListAsync();
                var projectIds = assignedTasks.Select(t => t.ProjectId).Distinct().ToList();
                projects = projects.Where(p => projectIds.Contains(p.Id)).ToList();
            }
        }
        
        return Ok(projects);
    }

    [HttpGet("assigned")]
    public async Task<ActionResult<List<ProjectDto>>> GetAssignedProjects()
    {
        var projects = await _projectService.GetAllProjectsAsync();
        var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var user = await _context.Users.Find(u => u.Email == userEmail).FirstOrDefaultAsync();
        if (user != null)
        {
            var assignedTasks = await _context.Tasks.Find(t => t.AssigneeNames != null && t.AssigneeNames.Contains(user.FullName)).ToListAsync();
            var projectIds = assignedTasks.Select(t => t.ProjectId).Distinct().ToList();
            projects = projects.Where(p => projectIds.Contains(p.Id)).ToList();
        }
        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectDto>> GetProject(string id)
    {
        var project = await _projectService.GetProjectByIdAsync(id);
        if (project == null)
            return NotFound();

        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (project.ManagerId != userId)
                return Forbid();
        }

        return Ok(project);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<ProjectDto>> CreateProject(ProjectDto projectDto)
    {
        if (User.IsInRole("ProjectManager"))
        {
            projectDto.ManagerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            projectDto.ManagerName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        }

        var project = await _projectService.CreateProjectAsync(projectDto);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult<ProjectDto>> UpdateProject(string id, ProjectDto projectDto)
    {
        var existing = await _context.Projects.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (existing.ManagerId != userId) return Forbid();
        }

        var update = Builders<Domain.Entities.Project>.Update
            .Set(p => p.Name, projectDto.Name ?? existing.Name)
            .Set(p => p.Description, projectDto.Description ?? existing.Description)
            .Set(p => p.CompanyName, projectDto.Company ?? existing.CompanyName)
            .Set(p => p.Health, projectDto.Health ?? existing.Health)
            .Set(p => p.Progress, projectDto.Progress > 0 ? projectDto.Progress : existing.Progress)
            .Set(p => p.Budget, projectDto.Budget > 0 ? projectDto.Budget : existing.Budget)
            .Set(p => p.Spent, projectDto.Spent > 0 ? projectDto.Spent : existing.Spent)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrEmpty(projectDto.Status))
        {
            if (Enum.TryParse<Domain.Enums.ProjectStatus>(projectDto.Status, true, out var status))
                update = update.Set(p => p.Status, status);
        }
        if (!string.IsNullOrEmpty(projectDto.StartDate))
        {
            if (DateTime.TryParse(projectDto.StartDate, out var sd))
                update = update.Set(p => p.StartDate, sd);
        }
        if (!string.IsNullOrEmpty(projectDto.EndDate))
        {
            if (DateTime.TryParse(projectDto.EndDate, out var ed))
                update = update.Set(p => p.EndDate, ed);
        }

        await _context.Projects.UpdateOneAsync(p => p.Id == id, update);

        var updated = await _projectService.GetProjectByIdAsync(id);
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
    public async Task<ActionResult> DeleteProject(string id)
    {
        var existing = await _context.Projects.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        if (User.IsInRole("ProjectManager"))
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (existing.ManagerId != userId) return Forbid();
        }

        // Delete related data
        await _context.Tasks.DeleteManyAsync(t => t.ProjectId == id);
        await _context.Milestones.DeleteManyAsync(m => m.ProjectId == id);
        await _context.TimeLogs.DeleteManyAsync(l => l.ProjectId == id);
        await _context.Attachments.DeleteManyAsync(a => a.ProjectId == id);
        await _context.ProgressUpdates.DeleteManyAsync(pu => pu.ProjectId == id);
        await _context.Projects.DeleteOneAsync(p => p.Id == id);

        return NoContent();
    }
}
