using System;
using System.Collections.Generic;
using ProjectProgress.Domain.Common;
using ProjectProgress.Domain.Enums;

namespace ProjectProgress.Domain.Entities;

public class TaskItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string MilestoneId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectProgress.Domain.Enums.TaskStatus Status { get; set; } = ProjectProgress.Domain.Enums.TaskStatus.ToDo;
    public Priority Priority { get; set; } = Priority.Medium;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public double EstimatedHours { get; set; }
    public List<string> AssignedUserIds { get; set; } = new();
    public List<string> AssigneeNames { get; set; } = new();
    public List<string> Dependencies { get; set; } = new();
    public int Progress { get; set; }
}

public class Milestone : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "upcoming";
    public Priority Priority { get; set; } = Priority.Medium;
    public int Progress { get; set; }
}
