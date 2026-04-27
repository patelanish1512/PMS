using System.Collections.Generic;

namespace ProjectProgress.Application.DTOs;

public class MilestoneDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Completion { get; set; }
    public MilestoneTasksDto Tasks { get; set; } = new();
    public List<string> Assignees { get; set; } = new();
    public string Priority { get; set; } = string.Empty;
}

public class MilestoneTasksDto
{
    public int Total { get; set; }
    public int Completed { get; set; }
}

public class TimeLogDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public string User { get; set; } = string.Empty;
    public double Hours { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class DocumentDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Project { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public string UploadedDate { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}

public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public bool Read { get; set; }
}

public class TeamMemberDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int ActiveProjects { get; set; }
    public int TasksAssigned { get; set; }
    public int TasksCompleted { get; set; }
    public double HoursThisWeek { get; set; }
    public int Utilization { get; set; }
    public string Avatar { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AuthLoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthRegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
