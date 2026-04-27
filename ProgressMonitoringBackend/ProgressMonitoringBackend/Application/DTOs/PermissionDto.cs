using System.Collections.Generic;

namespace ProgressMonitoringBackend.Application.DTOs;

public class PermissionDto
{
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}

public class PermissionMatrixDto
{
    public string Module { get; set; } = string.Empty;
    public string ModuleLabel { get; set; } = string.Empty;
    public Dictionary<string, PermissionDto> Roles { get; set; } = new();
}

public class MyPermissionsDto
{
    public Dictionary<string, PermissionDto> Modules { get; set; } = new();
}

public class PermissionUpdateDto
{
    public string RoleName { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}
