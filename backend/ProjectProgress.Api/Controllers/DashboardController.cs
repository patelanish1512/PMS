using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;
using Microsoft.AspNetCore.Authorization;
using TaskStatus = ProjectProgress.Domain.Enums.TaskStatus;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly MongoDbContext _context;
    public DashboardController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = User.IsInRole("Admin");
        var isPM = User.IsInRole("ProjectManager");
        var isMember = User.IsInRole("Member");
        var userName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        FilterDefinition<Domain.Entities.Project> projectFilter = Builders<Domain.Entities.Project>.Filter.Empty;
        if (isPM)
        {
            projectFilter = Builders<Domain.Entities.Project>.Filter.Eq(p => p.ManagerId, userId);
        }

        var projectsList = await _context.Projects.Find(projectFilter).ToListAsync();
        var managedProjectIds = projectsList.Select(p => p.Id).ToList();

        FilterDefinition<Domain.Entities.TaskItem> taskFilter = Builders<Domain.Entities.TaskItem>.Filter.Empty;
        if (isPM)
        {
            taskFilter = Builders<Domain.Entities.TaskItem>.Filter.In(t => t.ProjectId, managedProjectIds);
        }
        else if (isMember)
        {
            taskFilter = Builders<Domain.Entities.TaskItem>.Filter.AnyEq(t => t.AssigneeNames, userName);
        }

        var tasks = await _context.Tasks.Find(taskFilter).ToListAsync();
        
        var projects = projectsList;
        if (isMember)
        {
            var assignedProjectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();
            projects = projectsList.Where(p => assignedProjectIds.Contains(p.Id)).ToList();
        }

        var users = await _context.Users.Find(_ => true).ToListAsync();
        
        FilterDefinition<Domain.Entities.Milestone> milestoneFilter = Builders<Domain.Entities.Milestone>.Filter.Empty;
        if (isPM)
        {
            milestoneFilter = Builders<Domain.Entities.Milestone>.Filter.In(m => m.ProjectId, managedProjectIds);
        }
        var milestones = await _context.Milestones.Find(milestoneFilter).ToListAsync();

        var onTrack = projects.Count(p => p.Health == "on-track");
        var atRisk = projects.Count(p => p.Health == "at-risk");
        var delayed = projects.Count(p => p.Health == "delayed");

        var dto = new DashboardDto
        {
            Metrics = new List<MetricDto>
            {
                new() { Label = "Active Projects", Value = projects.Count(p => p.Status == Domain.Enums.ProjectStatus.Active).ToString(), Change = "", Trend = "up", Color = "orange" },
                new() { Label = "Tasks Completed", Value = tasks.Count(t => t.Status == TaskStatus.Done).ToString(), Change = "", Trend = "up", Color = "green" },
                new() { Label = "Overdue Items", Value = tasks.Count(t => t.EndDate < DateTime.UtcNow && t.Status != TaskStatus.Done).ToString(), Change = "", Trend = "down", Color = "red" },
                new() { Label = "Team Members", Value = users.Count.ToString(), Change = "", Trend = "up", Color = "blue" }
            },
            ProjectHealthData = new List<PieChartDto>
            {
                new() { Name = "On Track", Value = onTrack, Color = "#10b981" },
                new() { Name = "At Risk", Value = atRisk, Color = "#f59e0b" },
                new() { Name = "Delayed", Value = delayed, Color = "#ef4444" }
            },
            CompletionTrendData = new List<TrendDto>(),
            TaskStatusData = new List<BarChartDto>
            {
                new() { Status = "To Do", Count = tasks.Count(t => t.Status == TaskStatus.ToDo) },
                new() { Status = "In Progress", Count = tasks.Count(t => t.Status == TaskStatus.InProgress) },
                new() { Status = "Blocked", Count = tasks.Count(t => t.Status == TaskStatus.Blocked) },
                new() { Status = "Done", Count = tasks.Count(t => t.Status == TaskStatus.Done) }
            },
            RecentProjects = projects.OrderByDescending(p => p.UpdatedAt).Take(4).Select(p => new RecentProjectDto
            {
                Name = p.Name,
                Company = p.CompanyName,
                Progress = p.Progress,
                Status = p.Health,
                DueDate = p.EndDate.ToString("yyyy-MM-dd"),
                Team = p.TeamCount
            }).ToList(),
            UpcomingMilestones = milestones
                .Where(m => m.DueDate >= DateTime.UtcNow)
                .OrderBy(m => m.DueDate)
                .Take(3)
                .Select(m => new UpcomingMilestoneDto
                {
                    Project = m.ProjectName,
                    Milestone = m.Title,
                    Date = m.DueDate.ToString("yyyy-MM-dd"),
                    Status = m.Status
                }).ToList()
        };

        return Ok(dto);
    }


    [HttpGet("stats")]
    public async Task<ActionResult<List<MetricDto>>> GetStats()
    {
        var result = await GetDashboard();
        return Ok(((DashboardDto)((OkObjectResult)result.Result!).Value!).Metrics);
    }

    [HttpGet("project-health")]
    public async Task<ActionResult<List<PieChartDto>>> GetProjectHealth()
    {
        var result = await GetDashboard();
        return Ok(((DashboardDto)((OkObjectResult)result.Result!).Value!).ProjectHealthData);
    }

    [HttpGet("task-status")]
    public async Task<ActionResult<List<BarChartDto>>> GetTaskStatus()
    {
        var result = await GetDashboard();
        return Ok(((DashboardDto)((OkObjectResult)result.Result!).Value!).TaskStatusData);
    }

    [HttpGet("completion-trend")]
    public async Task<ActionResult<List<TrendDto>>> GetCompletionTrend()
    {
        var result = await GetDashboard();
        return Ok(((DashboardDto)((OkObjectResult)result.Result!).Value!).CompletionTrendData);
    }

    [HttpGet("client")]
    [Authorize(Roles = "Admin,ProjectManager,Client")]
    public async Task<ActionResult<DashboardDto>> GetClientDashboard()
    {
        var department = User.FindFirst("department")?.Value;
        if (string.IsNullOrEmpty(department)) return Ok(new DashboardDto());

        var projects = await _context.Projects.Find(p => p.CompanyName == department).ToListAsync();
        var managedProjectIds = projects.Select(p => p.Id).ToList();
        
        var milestones = await _context.Milestones.Find(m => managedProjectIds.Contains(m.ProjectId)).ToListAsync();

        var onTrack = projects.Count(p => p.Health == "on-track");
        var atRisk = projects.Count(p => p.Health == "at-risk");
        var delayed = projects.Count(p => p.Health == "delayed");

        var dto = new DashboardDto
        {
            Metrics = new List<MetricDto>
            {
                new() { Label = "Active Projects", Value = projects.Count(p => p.Status == Domain.Enums.ProjectStatus.Active).ToString(), Change = "", Trend = "up", Color = "orange" },
                new() { Label = "Milestones Pending", Value = milestones.Count(m => m.Status != "completed").ToString(), Change = "", Trend = "down", Color = "blue" }
            },
            ProjectHealthData = new List<PieChartDto>
            {
                new() { Name = "On Track", Value = onTrack, Color = "#10b981" },
                new() { Name = "At Risk", Value = atRisk, Color = "#f59e0b" },
                new() { Name = "Delayed", Value = delayed, Color = "#ef4444" }
            },
            RecentProjects = projects.OrderByDescending(p => p.UpdatedAt).Take(4).Select(p => new RecentProjectDto
            {
                Name = p.Name,
                Company = p.CompanyName,
                Progress = p.Progress,
                Status = p.Health,
                DueDate = p.EndDate.ToString("yyyy-MM-dd"),
                Team = 0 // hide team
            }).ToList(),
            UpcomingMilestones = milestones
                .Where(m => m.DueDate >= DateTime.UtcNow)
                .OrderBy(m => m.DueDate)
                .Take(3)
                .Select(m => new UpcomingMilestoneDto
                {
                    Project = m.ProjectName,
                    Milestone = m.Title,
                    Date = m.DueDate.ToString("yyyy-MM-dd"),
                    Status = m.Status
                }).ToList(),
            CompletionTrendData = new List<TrendDto>
            {
                new() { Month = "Jan", Completed = 5, Planned = 7 },
                new() { Month = "Feb", Completed = 8, Planned = 10 },
                new() { Month = "Mar", Completed = 12, Planned = 15 }
            },
            TaskStatusData = new List<BarChartDto>
            {
                new() { Status = "Completed", Count = milestones.Count(m => m.Status == "completed") },
                new() { Status = "In Progress", Count = milestones.Count(m => m.Status == "in-progress") },
                new() { Status = "Pending", Count = milestones.Count(m => m.Status == "planned") }
            }
        };

        return Ok(dto);
    }

    [HttpGet("upcoming-milestones")]
    public async Task<ActionResult<List<UpcomingMilestoneDto>>> GetUpcomingMilestones()
    {
        var result = await GetDashboard();
        return Ok(((DashboardDto)((OkObjectResult)result.Result!).Value!).UpcomingMilestones);
    }
}
