using System;

namespace ProjectProgress.Application.DTOs;

public class ProjectDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string? ManagerId { get; set; }
    public string? ManagerName { get; set; }


    public string Status { get; set; } = string.Empty;
    public string Health { get; set; } = string.Empty;
    public int Progress { get; set; }
    public decimal Budget { get; set; }
    public decimal Spent { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public int Team { get; set; }
    public TaskSummaryDto Tasks { get; set; } = new();
    public MilestoneSummaryDto Milestones { get; set; } = new();
}

public class TaskSummaryDto
{
    public int Total { get; set; }
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int Blocked { get; set; }
}

public class MilestoneSummaryDto
{
    public int Total { get; set; }
    public int Completed { get; set; }
}
