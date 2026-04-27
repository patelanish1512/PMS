using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace ProgressMonitoringBackend.Application.DTOs;

public class MilestoneDto
{
    public string Id { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Project { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    [Range(0, 100)]
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

    [Required]
    public string Project { get; set; } = string.Empty;

    [Required]
    public string Task { get; set; } = string.Empty;

    public string User { get; set; } = string.Empty;

    [Range(0.1, 24)]
    public double Hours { get; set; }

    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
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
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
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

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string JoinedDate { get; set; } = string.Empty;
}

/// <summary>Form model for file upload endpoint (multipart/form-data).</summary>
public class UploadAttachmentDto
{
    /// <summary>The file to upload.</summary>
    public IFormFile File { get; set; } = null!;

    /// <summary>Project this attachment belongs to.</summary>
    public string ProjectId { get; set; } = string.Empty;

    /// <summary>Project display name.</summary>
    public string ProjectName { get; set; } = string.Empty;

    /// <summary>Optional task ID this attachment belongs to.</summary>
    public string? TaskId { get; set; }

    /// <summary>Optional task display name.</summary>
    public string? TaskName { get; set; }

    /// <summary>Optional category label (e.g. "design", "contract").</summary>
    public string? Category { get; set; }
}

