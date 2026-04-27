using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Api.Controllers;

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
    [Authorize(Roles = "Admin,ProjectManager,Member")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentDto>> Upload(
        [FromForm] IFormFile file,
        [FromForm] string projectId,
        [FromForm] string projectName,
        [FromForm] string? taskId,
        [FromForm] string? taskName,
        [FromForm] string? category)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        // Create uploads directory
        var uploadsPath = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(uploadsPath, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";

        var attachment = new Domain.Entities.AttachmentItem
        {
            ProjectId = projectId ?? "",
            ProjectName = projectName ?? "",
            TaskId = taskId ?? "",
            TaskName = taskName ?? "",
            UploadedBy = userId,
            UploadedByName = userName,
            FileName = file.FileName,
            FileType = Path.GetExtension(file.FileName).TrimStart('.'),
            FileSize = file.Length,
            FileUrl = $"/uploads/{uniqueName}",
            UploadedAt = DateTime.UtcNow
        };

        await _context.Attachments.InsertOneAsync(attachment);

        // Create notification
        var notification = new Domain.Entities.NotificationItem
        {
            UserId = userId,
            Title = "Document Uploaded",
            Message = $"{userName} uploaded {file.FileName} to {projectName}",
            Type = "document"
        };
        await _context.Notifications.InsertOneAsync(notification);

        return Ok(MapToDto(attachment));
    }

    [HttpPost("upload-json")]
    [Authorize(Roles = "Admin,ProjectManager,Member")]
    public async Task<ActionResult<DocumentDto>> UploadJson([FromBody] Domain.Entities.AttachmentItem attachment)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";
        attachment.UploadedBy = userId;
        attachment.UploadedByName = userName;
        attachment.UploadedAt = DateTime.UtcNow;

        await _context.Attachments.InsertOneAsync(attachment);
        return Ok(MapToDto(attachment));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,ProjectManager")]
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

    private static DocumentDto MapToDto(Domain.Entities.AttachmentItem a) => new()
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
