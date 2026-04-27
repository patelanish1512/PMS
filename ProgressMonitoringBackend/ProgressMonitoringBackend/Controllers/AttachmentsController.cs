using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using Microsoft.AspNetCore.Hosting;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.IO;


namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly MongoDbContext _context;
    private readonly IWebHostEnvironment _env;

    public AttachmentsController(MongoDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<DocumentDto>>> GetByProject(string projectId)
    {
        var docs = await _context.Attachments.Find(a => a.ProjectId == projectId).ToListAsync();
        return Ok(docs.Select(MapToDto).ToList());
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<List<DocumentDto>>> GetByTask(string taskId)
    {
        var docs = await _context.Attachments.Find(a => a.TaskId == taskId).ToListAsync();
        return Ok(docs.Select(MapToDto).ToList());
    }

    [HttpGet]
    public async Task<ActionResult<List<DocumentDto>>> GetAll()
    {
        var docs = await _context.Attachments.Find(_ => true).ToListAsync();
        return Ok(docs.Select(MapToDto).ToList());
    }

    [HttpPost("upload")]
    [RequirePermission("documents", "CanCreate")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentDto>> Upload([FromForm] UploadAttachmentDto dto)
    {
        if (dto.File == null || dto.File.Length == 0)
            return BadRequest("No file provided");

        // Create uploads directory
        var uploadsPath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(dto.File.FileName)}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await dto.File.CopyToAsync(stream);
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";

        var attachment = new ProgressMonitoringBackend.Domain.Entities.AttachmentItem
        {
            ProjectId = dto.ProjectId ?? "",
            ProjectName = dto.ProjectName ?? "",
            TaskId = dto.TaskId ?? "",
            TaskName = dto.TaskName ?? "",
            UploadedBy = userId,
            UploadedByName = userName,
            FileName = dto.File.FileName,
            FileType = Path.GetExtension(dto.File.FileName).TrimStart('.'),
            FileSize = dto.File.Length,
            FileUrl = $"/uploads/{uniqueName}",
            UploadedAt = DateTime.UtcNow
        };

        await _context.Attachments.InsertOneAsync(attachment);

        // Create notification
        var notification = new ProgressMonitoringBackend.Domain.Entities.NotificationItem
        {
            UserId = userId,
            Title = "Document Uploaded",
            Message = $"{userName} uploaded {dto.File.FileName} to {dto.ProjectName}",
            Type = "document",
            IsRead = false
        };
        await _context.Notifications.InsertOneAsync(notification);

        return Ok(MapToDto(attachment));
    }


    [HttpDelete("{id}")]
    [RequirePermission("documents", "CanDelete")]
    public async Task<IActionResult> Delete(string id)
    {
        var doc = await _context.Attachments.Find(a => a.Id == id).FirstOrDefaultAsync();
        if (doc == null) return NotFound();

        // Try delete file from disk
        if (!string.IsNullOrEmpty(doc.FileUrl))
        {
            var filePath = Path.Combine(_env.ContentRootPath, "wwwroot", doc.FileUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }

        await _context.Attachments.DeleteOneAsync(a => a.Id == id);
        return NoContent();
    }

    private static DocumentDto MapToDto(ProgressMonitoringBackend.Domain.Entities.AttachmentItem a) => new()
    {
        Id = a.Id,
        Name = a.FileName,
        Type = a.FileType,
        Size = FormatSize(a.FileSize),
        Project = a.ProjectName,
        UploadedBy = a.UploadedByName,
        UploadedDate = a.UploadedAt.ToString("yyyy-MM-dd"),
        Category = "general"
    };

    private static string FormatSize(long bytes)
    {
        if (bytes >= 1024 * 1024) return $"{bytes / (1024.0 * 1024.0):F1} MB";
        if (bytes >= 1024) return $"{bytes / 1024.0:F0} KB";
        return $"{bytes} B";
    }
}
