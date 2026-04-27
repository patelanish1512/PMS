using System;
using System.Collections.Generic;
using ProgressMonitoringBackend.Domain.Common;

namespace ProgressMonitoringBackend.Domain.Entities;

public class TimeLog : BaseEntity
{
    public string TaskId { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public DateTime LogDate { get; set; }
    public double HoursSpent { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "approved";
}

public class ProgressUpdate : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskId { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int PercentComplete { get; set; }
    public string StatusSummary { get; set; } = string.Empty;
    public string IssuesRisks { get; set; } = string.Empty;
    public DateTime UpdateDateTime { get; set; } = DateTime.UtcNow;
}

public class AttachmentItem : BaseEntity
{
    public string ProjectId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string TaskId { get; set; } = string.Empty;
    public string TaskName { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public string UploadedByName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class NotificationItem : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public bool IsRead { get; set; }
}

public class SystemSettings : BaseEntity
{
    public string SystemName { get; set; } = "Project Progress Monitoring System";
    public string OrganizationName { get; set; } = "Acme Corp";
    public string OrganizationLogoUrl { get; set; } = "";
    public string ContactEmail { get; set; } = "admin@acme.com";
    public string Address { get; set; } = "123 Business Way, Tech City";
    public string PrimaryDomain { get; set; } = "pms.company.com";
    public string Timezone { get; set; } = "UTC";
    public string DateFormat { get; set; } = "YYYY-MM-DD";
    public bool MaintenanceMode { get; set; }
    public bool EnableNotifications { get; set; } = true;
    public List<string> AllowedFileTypes { get; set; } = new() { ".pdf", ".docx", ".xlsx", ".png", ".jpg" };
    public int MaxUploadSizeMB { get; set; } = 10;
    public int RetentionDays { get; set; } = 365;
}
