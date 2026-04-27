using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly MongoDbContext _context;
    public SettingsController(MongoDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetSettings()
    {
        var settings = await _context.Settings.Find(_ => true).FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new Domain.Entities.SystemSettings();
            await _context.Settings.InsertOneAsync(settings);
        }
        return Ok(settings);
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateSettings([FromBody] Domain.Entities.SystemSettings settings)
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
