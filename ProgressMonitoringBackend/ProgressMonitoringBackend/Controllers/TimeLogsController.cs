using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Attributes;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/time-logs")]
[Route("api/[controller]")]
[Authorize]
public class TimeLogsController : ControllerBase
{
    private readonly MongoDbContext _context;
    public TimeLogsController(MongoDbContext context) => _context = context;

    [HttpGet]
    [RequirePermission("timelogs", "CanView")]
    public async Task<ActionResult<List<TimeLogDto>>> GetTimeLogs()
    {
        FilterDefinition<ProgressMonitoringBackend.Domain.Entities.TimeLog> filter = Builders<ProgressMonitoringBackend.Domain.Entities.TimeLog>.Filter.Empty;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (User.IsInRole("Member"))
        {
            filter = Builders<ProgressMonitoringBackend.Domain.Entities.TimeLog>.Filter.Eq(l => l.UserId, userId);
        }

        var logs = await _context.TimeLogs.Find(filter).SortByDescending(l => l.LogDate).ToListAsync();
        return Ok(logs.Select(MapToDto).ToList());
    }

    [HttpGet("project/{projectId}")]
    [RequirePermission("timelogs", "CanView")]
    public async Task<ActionResult<List<TimeLogDto>>> GetByProject(string projectId)
    {
        var logs = await _context.TimeLogs.Find(l => l.ProjectId == projectId).ToListAsync();
        return Ok(logs.Select(MapToDto).ToList());
    }

    [HttpPost]
    [RequirePermission("timelogs", "CanCreate")]
    public async Task<ActionResult<TimeLogDto>> CreateTimeLog([FromBody] ProgressMonitoringBackend.Domain.Entities.TimeLog log)
    {
        if (User.IsInRole("Member"))
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUserName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
            log.UserId = currentUserId ?? "";
            log.UserName = currentUserName ?? "";
            log.Status = "pending";
        }
        await _context.TimeLogs.InsertOneAsync(log);
        return Ok(MapToDto(log));
    }

    [HttpPut("{id}")]
    [RequirePermission("timelogs", "CanEdit")]
    public async Task<IActionResult> UpdateTimeLog(string id, [FromBody] ProgressMonitoringBackend.Domain.Entities.TimeLog log)
    {
        var existing = await _context.TimeLogs.Find(l => l.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        if (User.IsInRole("Member"))
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (existing.UserId != currentUserId || existing.Status == "approved") return Forbid();
            log.Status = existing.Status;
            log.UserId = currentUserId ?? "";
        }

        log.Id = id;
        log.CreatedAt = existing.CreatedAt;
        log.UpdatedAt = DateTime.UtcNow;
        await _context.TimeLogs.ReplaceOneAsync(l => l.Id == id, log);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RequirePermission("timelogs", "CanDelete")]
    public async Task<IActionResult> DeleteTimeLog(string id)
    {
        var result = await _context.TimeLogs.DeleteOneAsync(l => l.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/approve")]
    [RequirePermission("timelogs", "CanEdit")]
    public async Task<IActionResult> ApproveTimeLog(string id)
    {
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.TimeLog>.Update
            .Set(l => l.Status, "approved")
            .Set(l => l.UpdatedAt, DateTime.UtcNow);
        var result = await _context.TimeLogs.UpdateOneAsync(l => l.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpPatch("{id}/reject")]
    [RequirePermission("timelogs", "CanEdit")]
    public async Task<IActionResult> RejectTimeLog(string id)
    {
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.TimeLog>.Update
            .Set(l => l.Status, "rejected")
            .Set(l => l.UpdatedAt, DateTime.UtcNow);
        var result = await _context.TimeLogs.UpdateOneAsync(l => l.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    private static TimeLogDto MapToDto(ProgressMonitoringBackend.Domain.Entities.TimeLog l) => new()
    {
        Id = l.Id,
        Date = l.LogDate.ToString("yyyy-MM-dd"),
        Project = l.ProjectName,
        Task = l.TaskName,
        User = l.UserName,
        Hours = l.HoursSpent,
        Status = l.Status,
        Description = l.Description
    };
}
