using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Authorization;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly MongoDbContext _context;

    public PermissionAuthorizationHandler(MongoDbContext context)
    {
        _context = context;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User == null) return;

        var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrEmpty(role)) return;

        // Admin always has permission
        if (role == "Admin")
        {
            context.Succeed(requirement);
            return;
        }

        var permission = await _context.RolePermissions
            .Find(p => p.RoleName == role && p.Module == requirement.Module)
            .FirstOrDefaultAsync();

        if (permission == null) return;

        bool hasPermission = requirement.Permission switch
        {
            "CanView" => permission.CanView,
            "CanCreate" => permission.CanCreate,
            "CanEdit" => permission.CanEdit,
            "CanDelete" => permission.CanDelete,
            _ => false
        };

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
