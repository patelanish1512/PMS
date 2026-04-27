using System;
using ProjectProgress.Domain.Common;
using ProjectProgress.Domain.Enums;

namespace ProjectProgress.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CompanyId { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ManagerId { get; set; } = string.Empty;
    public string ManagerName { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public string Priority { get; set; } = "medium";
    public string Health { get; set; } = "on-track";
    public int Progress { get; set; }
    public decimal Budget { get; set; }
    public decimal Spent { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TeamCount { get; set; }
    public TaskSummary TaskSummary { get; set; } = new();
    public MilestoneSummary MilestoneSummary { get; set; } = new();
}

public class TaskSummary
{
    public int Total { get; set; }
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int Blocked { get; set; }
}

public class MilestoneSummary
{
    public int Total { get; set; }
    public int Completed { get; set; }
}
