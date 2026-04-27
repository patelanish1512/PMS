using System;
using System.Collections.Generic;

namespace ProjectProgress.Application.DTOs;

public class TaskDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public AssigneeDto Assignee { get; set; } = new();
    public string Priority { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public int Attachments { get; set; }
    public int Comments { get; set; }
}

public class AssigneeDto
{
    public string Name { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}

public class TaskBoardDto
{
    public List<TaskDto> Todo { get; set; } = new();
    public List<TaskDto> InProgress { get; set; } = new();
    public List<TaskDto> Blocked { get; set; } = new();
    public List<TaskDto> Done { get; set; } = new();
}
