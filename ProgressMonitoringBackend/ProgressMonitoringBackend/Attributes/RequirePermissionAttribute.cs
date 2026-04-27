using Microsoft.AspNetCore.Authorization;

namespace ProgressMonitoringBackend.Attributes;

public class RequirePermissionAttribute : AuthorizeAttribute
{
    public string Module { get; }
    public string Permission { get; }

    public RequirePermissionAttribute(string module, string permission)
    {
        Module = module;
        Permission = permission;
        Policy = $"Permission:{module}:{permission}";
    }
}
