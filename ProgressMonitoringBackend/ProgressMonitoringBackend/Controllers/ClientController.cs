using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/client")]
[Authorize]
[RequirePermission("projects", "CanView")]
public class ClientController : ControllerBase
{
    private readonly MongoDbContext _context;

    public ClientController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet("projects")]
    public async Task<ActionResult<List<object>>> GetClientProjects()
    {
        var department = User.FindFirst("department")?.Value;
        if (string.IsNullOrEmpty(department)) return Ok(new List<object>());

        var projects = await _context.Projects.Find(p => p.CompanyName == department).ToListAsync();
        return Ok(projects);
    }

    [HttpGet("projects/{id}")]
    public async Task<ActionResult<object>> GetClientProject(string id)
    {
        var department = User.FindFirst("department")?.Value;
        if (string.IsNullOrEmpty(department)) return NotFound();

        var project = await _context.Projects.Find(p => p.Id == id && p.CompanyName == department).FirstOrDefaultAsync();
        if (project == null) return NotFound();
        return Ok(project);
    }

    [HttpGet("projects/{id}/milestones")]
    public async Task<ActionResult<List<object>>> GetClientMilestones(string id)
    {
        var milestones = await _context.Milestones.Find(m => m.ProjectId == id).ToListAsync();
        return Ok(milestones);
    }

    [HttpGet("milestones")]
    public async Task<ActionResult<List<object>>> GetClientAllMilestones()
    {
        var department = User.FindFirst("department")?.Value;
        if (string.IsNullOrEmpty(department)) return Ok(new List<object>());

        var projects = await _context.Projects.Find(p => p.CompanyName == department).ToListAsync();
        var projectIds = projects.Select(p => p.Id).ToList();

        var milestones = await _context.Milestones.Find(m => projectIds.Contains(m.ProjectId)).ToListAsync();
        return Ok(milestones);
    }

    [HttpGet("projects/{id}/documents")]
    public async Task<ActionResult<List<DocumentDto>>> GetClientDocuments(string id)
    {
        var docs = await _context.Attachments.Find(a => a.ProjectId == id).ToListAsync();
        
        var dtos = docs.Select(a => new DocumentDto
        {
            Id = a.Id,
            Name = a.FileName,
            Type = a.FileType,
            Size = FormatSize(a.FileSize),
            Project = a.ProjectName,
            UploadedBy = a.UploadedByName,
            UploadedDate = a.UploadedAt.ToString("yyyy-MM-dd"),
            Category = "general"
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("documents")]
    public async Task<ActionResult<List<DocumentDto>>> GetClientAllDocuments()
    {
        var department = User.FindFirst("department")?.Value;
        if (string.IsNullOrEmpty(department)) return Ok(new List<DocumentDto>());

        var projects = await _context.Projects.Find(p => p.CompanyName == department).ToListAsync();
        var projectIds = projects.Select(p => p.Id).ToList();

        var docs = await _context.Attachments.Find(a => projectIds.Contains(a.ProjectId)).ToListAsync();
        
        var dtos = docs.Select(a => new DocumentDto
        {
            Id = a.Id,
            Name = a.FileName,
            Type = a.FileType,
            Size = FormatSize(a.FileSize),
            Project = a.ProjectName,
            UploadedBy = a.UploadedByName,
            UploadedDate = a.UploadedAt.ToString("yyyy-MM-dd"),
            Category = "general"
        }).ToList();

        return Ok(dtos);
    }

    private static string FormatSize(long bytes)
    {
        if (bytes >= 1024 * 1024) return $"{bytes / (1024.0 * 1024.0):F1} MB";
        if (bytes >= 1024) return $"{bytes / 1024.0:F0} KB";
        return $"{bytes} B";
    }
}
