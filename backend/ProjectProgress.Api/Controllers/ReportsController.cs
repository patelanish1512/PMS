using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProjectProgress.Infrastructure.Mongo;
using TaskStatus = ProjectProgress.Domain.Enums.TaskStatus;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly MongoDbContext _context;
    public ReportsController(MongoDbContext context) => _context = context;

    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        var projects = await _context.Projects.Find(_ => true).ToListAsync();
        var tasks = await _context.Tasks.Find(_ => true).ToListAsync();
        var logs = await _context.TimeLogs.Find(_ => true).ToListAsync();
        var users = await _context.Users.Find(_ => true).ToListAsync();
        var milestones = await _context.Milestones.Find(_ => true).ToListAsync();

        var thisMonthProjects = projects.Count(p => p.CreatedAt >= DateTime.UtcNow.AddDays(-30));
        var lastMonthProjects = projects.Count(p => p.CreatedAt >= DateTime.UtcNow.AddDays(-60) && p.CreatedAt < DateTime.UtcNow.AddDays(-30));
        var growthRate = lastMonthProjects > 0 ? ((thisMonthProjects - lastMonthProjects) / (double)lastMonthProjects * 100) : 0;

        var completedTasks = tasks.Count(t => t.Status == TaskStatus.Done);
        var onTimeTasks = tasks.Count(t => t.Status == TaskStatus.Done && t.UpdatedAt <= t.EndDate);
        var efficiency = completedTasks > 0 ? (int)(onTimeTasks / (double)completedTasks * 100) : 0;

        var activeUsersThisWeek = logs.Where(l => l.LogDate >= DateTime.UtcNow.AddDays(-7))
            .Select(l => l.UserId).Distinct().Count();

        var completedMilestones = milestones.Count(m => m.Status == "completed");
        var totalDocs = await _context.Attachments.CountDocumentsAsync(_ => true);

        var stats = new
        {
            GrowthRate = Math.Round(growthRate, 1),
            Efficiency = efficiency,
            ActiveUsers = activeUsersThisWeek,
            Deliverables = completedMilestones + (int)totalDocs,
            TotalProjects = projects.Count,
            ActiveProjects = projects.Count(p => p.Status == Domain.Enums.ProjectStatus.Active),
            CompletedProjects = projects.Count(p => p.Status == Domain.Enums.ProjectStatus.Completed),
            TotalTasks = tasks.Count,
            CompletedTasks = completedTasks,
            OverdueTasks = tasks.Count(t => t.EndDate < DateTime.UtcNow && t.Status != TaskStatus.Done),
            TotalHoursLogged = logs.Sum(l => l.HoursSpent),
            TotalBudget = projects.Sum(p => p.Budget),
            TotalSpent = projects.Sum(p => p.Spent),
            TeamSize = users.Count
        };

        return Ok(stats);
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<object>>> GetRecentReports()
    {
        var projects = await _context.Projects.Find(_ => true).ToListAsync();
        var tasks = await _context.Tasks.Find(_ => true).ToListAsync();
        var logs = await _context.TimeLogs.Find(_ => true).ToListAsync();

        var reports = new List<object>
        {
            new {
                Id = "project-overview",
                Name = "Project Overview Report",
                Type = "project",
                GeneratedDate = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd"),
                Size = "2.4 MB",
                Status = "ready",
                Summary = $"{projects.Count} total projects, {projects.Count(p => p.Status == Domain.Enums.ProjectStatus.Active)} active"
            },
            new {
                Id = "task-summary",
                Name = "Task Summary Report",
                Type = "task",
                GeneratedDate = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"),
                Size = "1.8 MB",
                Status = "ready",
                Summary = $"{tasks.Count} total tasks, {tasks.Count(t => t.Status == TaskStatus.Done)} completed"
            },
            new {
                Id = "time-utilization",
                Name = "Time Utilization Report",
                Type = "time",
                GeneratedDate = DateTime.UtcNow.AddDays(-3).ToString("yyyy-MM-dd"),
                Size = "1.2 MB",
                Status = "ready",
                Summary = $"{logs.Sum(l => l.HoursSpent):F0} total hours logged"
            },
            new {
                Id = "budget-analysis",
                Name = "Budget Analysis Report",
                Type = "budget",
                GeneratedDate = DateTime.UtcNow.AddDays(-5).ToString("yyyy-MM-dd"),
                Size = "3.1 MB",
                Status = "ready",
                Summary = $"${projects.Sum(p => p.Spent):N0} spent of ${projects.Sum(p => p.Budget):N0} budget"
            }
        };

        return Ok(reports);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetAllReports()
    {
        var projects = await _context.Projects.Find(_ => true).ToListAsync();
        var tasks = await _context.Tasks.Find(_ => true).ToListAsync();
        var logs = await _context.TimeLogs.Find(_ => true).ToListAsync();
        var users = await _context.Users.Find(_ => true).ToListAsync();

        var report = new {
            GeneratedAt = DateTime.UtcNow,
            ProjectSummary = projects.Select(p => new {
                p.Name, p.Status, p.Progress, p.Budget, p.Spent, p.Health
            }),
            UtilizationData = users.Select(u => new {
                u.FullName,
                Hours = logs.Where(l => l.UserId == u.Id).Sum(l => l.HoursSpent)
            })
        };

        return Ok(report);
    }
}
