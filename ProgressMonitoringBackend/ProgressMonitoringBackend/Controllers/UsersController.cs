using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;
using ProgressMonitoringBackend.Domain.Enums;
using ProgressMonitoringBackend.Attributes;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly MongoDbContext _context;
    public UsersController(MongoDbContext context) => _context = context;

    [HttpGet]
    [RequirePermission("team", "CanView")]
    public async Task<ActionResult<List<object>>> GetUsers()
    {
        var users = await _context.Users.Find(_ => true).ToListAsync();
        var projects = await _context.Projects.Find(_ => true).ToListAsync();
        var tasks = await _context.Tasks.Find(_ => true).ToListAsync();
        var logs = await _context.TimeLogs.Find(_ => true).ToListAsync();

        var teamData = users.Select(u => {
            var userTasks = tasks.Where(t => t.AssigneeNames != null && t.AssigneeNames.Contains(u.FullName)).ToList();
            var userLogs = logs.Where(l => l.UserId == u.Id && l.LogDate >= DateTime.UtcNow.AddDays(-7)).ToList();
            var userProjectIds = userTasks.Select(t => t.ProjectId).Distinct().ToList();
            var userProjectsCount = projects.Count(p => userProjectIds.Contains(p.Id));

            return new {
                id = u.Id,
                name = u.FullName,
                email = u.Email,
                role = u.Role.ToString(),
                designation = u.Designation,
                phone = u.Phone,
                location = u.Location,
                department = u.Department,
                status = u.Status,
                avatar = string.IsNullOrEmpty(u.Avatar)
                    ? u.FullName.Split(' ').Select(n => n.Length > 0 ? n[0].ToString() : "").Aggregate("", (a, b) => a + b)
                    : u.Avatar,
                activeProjects = userProjectsCount,
                tasksAssigned = userTasks.Count,
                tasksCompleted = userTasks.Count(t => t.Status == ProgressMonitoringBackend.Domain.Enums.TaskStatus.Done),
                hoursThisWeek = userLogs.Sum(l => l.HoursSpent),
                utilization = Math.Min(100, (int)((userLogs.Sum(l => l.HoursSpent) / 40.0) * 100)),
                joinedDate = u.CreatedAt.ToString("yyyy-MM-dd")
            };
        }).ToList();

        return Ok(teamData);
    }

    [HttpPost]
    [RequirePermission("team", "CanCreate")]
    public async Task<ActionResult> CreateUser([FromBody] ProgressMonitoringBackend.Domain.Entities.User user)
    {
        var existing = await _context.Users.Find(u => u.Email == user.Email).FirstOrDefaultAsync();
        if (existing != null) return BadRequest(new { message = "Email already exists" });

        user.CreatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password@123");
        if (string.IsNullOrEmpty(user.Avatar))
            user.Avatar = user.FullName.Split(' ').Select(n => n.Length > 0 ? n[0].ToString() : "").Aggregate("", (a, b) => a + b);
        await _context.Users.InsertOneAsync(user);
        return Ok(new { id = user.Id, name = user.FullName, email = user.Email, role = user.Role.ToString() });
    }

    [HttpPut("{id}")]
    [RequirePermission("team", "CanEdit")]
    public async Task<ActionResult> UpdateUser(string id, [FromBody] ProgressMonitoringBackend.Domain.Entities.User user)
    {
        var existing = await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update
            .Set(u => u.FullName, user.FullName)
            .Set(u => u.Email, user.Email)
            .Set(u => u.Designation, user.Designation)
            .Set(u => u.Phone, user.Phone)
            .Set(u => u.Location, user.Location)
            .Set(u => u.Department, user.Department)
            .Set(u => u.Role, user.Role)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _context.Users.UpdateOneAsync(u => u.Id == id, update);
        return Ok(new { message = "User updated" });
    }

    [HttpDelete("{id}")]
    [RequirePermission("team", "CanDelete")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        var result = await _context.Users.DeleteOneAsync(u => u.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return Ok();
    }

    [HttpPatch("{id}/role")]
    [RequirePermission("team", "CanEdit")]
    public async Task<ActionResult> UpdateRole(string id, [FromBody] string role)
    {
        if (!Enum.TryParse<UserRole>(role, true, out var userRole))
            return BadRequest("Invalid role");

        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update.Set(u => u.Role, userRole);
        var result = await _context.Users.UpdateOneAsync(u => u.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return Ok();
    }

    [HttpPatch("{id}/deactivate")]
    [RequirePermission("team", "CanEdit")]
    public async Task<ActionResult> DeactivateUser(string id)
    {
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update.Set(u => u.Status, "inactive");
        var result = await _context.Users.UpdateOneAsync(u => u.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return Ok();
    }

    [HttpPut("{id}/status")]
    [RequirePermission("team", "CanEdit")]
    public async Task<ActionResult> UpdateStatus(string id, [FromBody] string status)
    {
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update.Set(u => u.Status, status);
        var result = await _context.Users.UpdateOneAsync(u => u.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return Ok();
    }

    [HttpGet("me")]
    public async Task<ActionResult> GetMyProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null) return NotFound();

        return Ok(new {
            id = user.Id,
            name = user.FullName,
            email = user.Email,
            role = user.Role.ToString(),
            designation = user.Designation,
            phone = user.Phone,
            location = user.Location,
            department = user.Department,
            avatar = user.Avatar
        });
    }

    [HttpPut("me/profile")]
    public async Task<ActionResult> UpdateMyProfile([FromBody] ProfileUpdateDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var existing = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (existing == null) return NotFound();

        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update
            .Set(u => u.FullName, dto.FullName ?? existing.FullName)
            .Set(u => u.Phone, dto.Phone ?? existing.Phone)
            .Set(u => u.Location, dto.Location ?? existing.Location)
            .Set(u => u.Department, dto.Department ?? existing.Department)
            .Set(u => u.Designation, dto.Designation ?? existing.Designation)
            .Set(u => u.UpdatedAt, DateTime.UtcNow);

        await _context.Users.UpdateOneAsync(u => u.Id == userId, update);
        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpPut("me/password")]
    public async Task<ActionResult> ChangePassword([FromBody] PasswordChangeDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest(new { message = "Current password and new password are required" });

        if (dto.NewPassword.Length < 8)
            return BadRequest(new { message = "New password must be at least 8 characters" });

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect" });

        var newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        var update = Builders<ProgressMonitoringBackend.Domain.Entities.User>.Update.Set(u => u.PasswordHash, newHash);
        await _context.Users.UpdateOneAsync(u => u.Id == userId, update);

        return Ok(new { message = "Password changed successfully" });
    }
}

public class ProfileUpdateDto
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? Department { get; set; }
    public string? Designation { get; set; }
}

public class PasswordChangeDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
