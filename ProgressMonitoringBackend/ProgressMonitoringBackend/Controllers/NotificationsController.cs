using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly MongoDbContext _context;
    public NotificationsController(MongoDbContext context) => _context = context;

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<NotificationDto>>> GetByUser(string userId)
    {
        var notifications = await _context.Notifications.Find(n => n.UserId == userId)
            .SortByDescending(n => n.CreatedAt).ToListAsync();
        return Ok(notifications.Select(MapToDto).ToList());
    }

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> GetAll()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        FilterDefinition<ProgressMonitoringBackend.Domain.Entities.NotificationItem> filter;
        
        if (User.IsInRole("Admin"))
            filter = Builders<ProgressMonitoringBackend.Domain.Entities.NotificationItem>.Filter.Empty;
        else
            filter = Builders<ProgressMonitoringBackend.Domain.Entities.NotificationItem>.Filter.Eq(n => n.UserId, userId);

        var notifications = await _context.Notifications.Find(filter)
            .SortByDescending(n => n.CreatedAt).ToListAsync();
        return Ok(notifications.Select(MapToDto).ToList());
    }

    [HttpPatch("{id}/read")]
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.NotificationItem>.Update.Set(n => n.IsRead, true);
        var result = await _context.Notifications.UpdateOneAsync(n => n.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.NotificationItem>.Update.Set(n => n.IsRead, true);
        await _context.Notifications.UpdateManyAsync(n => n.UserId == userId && !n.IsRead, update);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(string id)
    {
        var result = await _context.Notifications.DeleteOneAsync(n => n.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }

    private static NotificationDto MapToDto(ProgressMonitoringBackend.Domain.Entities.NotificationItem n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Title = n.Title,
        Message = n.Message,
        Time = GetRelativeTime(n.CreatedAt),
        Read = n.IsRead
    };

    private static string GetRelativeTime(DateTime dt)
    {
        var diff = DateTime.UtcNow - dt;
        if (diff.TotalMinutes < 60) return $"{(int)diff.TotalMinutes} min ago";
        if (diff.TotalHours < 24) return $"{(int)diff.TotalHours} hours ago";
        return $"{(int)diff.TotalDays} days ago";
    }
}
