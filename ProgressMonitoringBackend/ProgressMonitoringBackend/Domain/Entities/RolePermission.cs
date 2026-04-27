using ProgressMonitoringBackend.Domain.Common;

namespace ProgressMonitoringBackend.Domain.Entities;

public class RolePermission : BaseEntity
{
    public string RoleName { get; set; } = string.Empty;   // "Admin", "ProjectManager", "Member", "Client"
    public string Module { get; set; } = string.Empty;     // "projects", "tasks", "milestones", "timelogs", "documents", "companies", "team", "reports", "settings"
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}
