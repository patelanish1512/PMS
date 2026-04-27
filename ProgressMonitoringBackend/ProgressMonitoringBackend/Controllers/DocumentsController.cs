using Microsoft.AspNetCore.Mvc;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly MongoDbContext _context;

    public DocumentsController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("documents", "CanView")]
    public async Task<ActionResult<List<DocumentDto>>> GetAll()
    {
        var docs = await _context.Documents.Find(_ => true).ToListAsync();
        return Ok(docs.Select(d => new DocumentDto
        {
            Id = d.Id,
            Name = d.FileName,
            Project = d.ProjectName,
            Category = "technical",
            UploadedBy = d.UploadedBy,
            UploadedDate = d.UploadedAt.ToString("yyyy-MM-dd"),
            Size = (d.FileSize / 1024.0 / 1024.0).ToString("F1") + " MB",
            Type = d.FileType
        }).ToList());
    }
}
