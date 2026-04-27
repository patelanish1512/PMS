using System.Collections.Generic;

namespace ProjectProgress.Application.DTOs;

public class DashboardDto
{
    public List<MetricDto> Metrics { get; set; } = new();
    public List<PieChartDto> ProjectHealthData { get; set; } = new();
    public List<TrendDto> CompletionTrendData { get; set; } = new();
    public List<BarChartDto> TaskStatusData { get; set; } = new();
    public List<RecentProjectDto> RecentProjects { get; set; } = new();
    public List<UpcomingMilestoneDto> UpcomingMilestones { get; set; } = new();
}

public class MetricDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Change { get; set; } = string.Empty;
    public string Trend { get; set; } = string.Empty; // "up" or "down"
    public string Color { get; set; } = string.Empty;
}

public class PieChartDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class TrendDto
{
    public string Month { get; set; } = string.Empty;
    public int Completed { get; set; }
    public int Planned { get; set; }
}

public class BarChartDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class RecentProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public int Progress { get; set; }
    public string Status { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public int Team { get; set; }
}

public class UpcomingMilestoneDto
{
    public string Project { get; set; } = string.Empty;
    public string Milestone { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
