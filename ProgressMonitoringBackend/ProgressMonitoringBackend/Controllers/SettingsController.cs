using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using System.Threading.Tasks;
using System;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly MongoDbContext _context;
    public SettingsController(MongoDbContext context) => _context = context;

    [HttpGet]
    [RequirePermission("settings", "CanEdit")]
    public async Task<ActionResult<object>> GetSettings()
    {
        var settings = await _context.Settings.Find(_ => true).FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new ProgressMonitoringBackend.Domain.Entities.SystemSettings();
            await _context.Settings.InsertOneAsync(settings);
        }
        return Ok(settings);
    }

    [HttpPut]
    [RequirePermission("settings", "CanEdit")]
    public async Task<ActionResult> UpdateSettings([FromBody] ProgressMonitoringBackend.Domain.Entities.SystemSettings settings)
    {
        var existing = await _context.Settings.Find(_ => true).FirstOrDefaultAsync();
        if (existing == null)
        {
            await _context.Settings.InsertOneAsync(settings);
        }
        else
        {
            settings.Id = existing.Id;
            settings.UpdatedAt = DateTime.UtcNow;
            await _context.Settings.ReplaceOneAsync(s => s.Id == existing.Id, settings);
        }
        return Ok(new { message = "Settings updated successfully" });
    }
}
