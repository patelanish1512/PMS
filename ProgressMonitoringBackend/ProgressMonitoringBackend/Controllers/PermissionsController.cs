using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MongoDB.Driver;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Application.DTOs;
using ProgressMonitoringBackend.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Security.Claims;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly MongoDbContext _context;
    private static readonly string[] Roles = ["Admin", "ProjectManager", "Member", "Client"];
    private static readonly string[] Modules = ["dashboard", "projects", "tasks", "milestones", "timelogs", "documents", "companies", "team", "reports", "settings", "notifications"];

    public PermissionsController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [HttpGet("matrix")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<PermissionMatrixDto>>> GetPermissions()
    {
        var allPerms = await _context.RolePermissions.Find(_ => true).ToListAsync();

        var result = Modules.Select(mod => new PermissionMatrixDto
        {
            Module = mod,
            ModuleLabel = GetModuleLabel(mod),
            Roles = Roles.ToDictionary(
                role => role,
                role => {
                    if (role == "Admin")
                    {
                        return AllAccess();
                    }

                    var p = allPerms.FirstOrDefault(x => x.RoleName == role && x.Module == mod);
                    return new PermissionDto
                    {
                        CanView = p?.CanView ?? false,
                        CanCreate = p?.CanCreate ?? false,
                        CanEdit = p?.CanEdit ?? false,
                        CanDelete = p?.CanDelete ?? false
                    };
                }
            )
        }).ToList();

        return Ok(result);
    }

    [HttpPut]
    [HttpPost("update")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdatePermissions([FromBody] List<PermissionUpdateDto> updates)
    {
        foreach (var update in updates.Where(IsValidUpdate))
        {
            if (update.RoleName == "Admin")
            {
                update.CanView = true;
                update.CanCreate = true;
                update.CanEdit = true;
                update.CanDelete = true;
            }

            var filter = Builders<RolePermission>.Filter.And(
                Builders<RolePermission>.Filter.Eq(p => p.RoleName, update.RoleName),
                Builders<RolePermission>.Filter.Eq(p => p.Module, update.Module)
            );

            var existing = await _context.RolePermissions.Find(filter).FirstOrDefaultAsync();

            if (existing != null)
            {
                var updateDef = Builders<RolePermission>.Update
                    .Set(p => p.CanView, update.CanView)
                    .Set(p => p.CanCreate, update.CanCreate)
                    .Set(p => p.CanEdit, update.CanEdit)
                    .Set(p => p.CanDelete, update.CanDelete)
                    .Set(p => p.UpdatedAt, DateTime.UtcNow);

                await _context.RolePermissions.UpdateOneAsync(filter, updateDef);
            }
            else
            {
                var newPerm = new RolePermission
                {
                    RoleName = update.RoleName,
                    Module = update.Module,
                    CanView = update.CanView,
                    CanCreate = update.CanCreate,
                    CanEdit = update.CanEdit,
                    CanDelete = update.CanDelete,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.RolePermissions.InsertOneAsync(newPerm);
            }
        }

        return Ok();
    }

    [HttpPut("{roleName}/{module}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpsertPermission(string roleName, string module, [FromBody] PermissionDto permission)
    {
        var update = new PermissionUpdateDto
        {
            RoleName = roleName,
            Module = module,
            CanView = permission.CanView,
            CanCreate = permission.CanCreate,
            CanEdit = permission.CanEdit,
            CanDelete = permission.CanDelete
        };

        if (!IsValidUpdate(update))
        {
            return BadRequest(new { message = "Invalid role or module." });
        }

        return await UpdatePermissions([update]);
    }

    [HttpDelete("{roleName}/{module}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeletePermission(string roleName, string module)
    {
        if (roleName == "Admin")
        {
            return BadRequest(new { message = "Admin permissions cannot be removed." });
        }

        if (!Roles.Contains(roleName) || !Modules.Contains(module))
        {
            return BadRequest(new { message = "Invalid role or module." });
        }

        await _context.RolePermissions.DeleteOneAsync(p => p.RoleName == roleName && p.Module == module);
        return NoContent();
    }

    [HttpGet("my")]
    [HttpGet("me")]
    public async Task<ActionResult<List<PermissionUpdateDto>>> GetMyPermissions()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrEmpty(role)) return BadRequest("User role not found");

        if (role == "Admin")
        {
            return Ok(Modules.Select(module => new PermissionUpdateDto
            {
                RoleName = role,
                Module = module,
                CanView = true,
                CanCreate = true,
                CanEdit = true,
                CanDelete = true
            }).ToList());
        }

        var perms = await _context.RolePermissions.Find(p => p.RoleName == role).ToListAsync();

        return Ok(perms.Select(p => new PermissionUpdateDto
        {
            RoleName = p.RoleName,
            Module = p.Module,
            CanView = p.CanView,
            CanCreate = p.CanCreate,
            CanEdit = p.CanEdit,
            CanDelete = p.CanDelete
        }).ToList());
    }

    private static string GetModuleLabel(string module)
    {
        return module switch
        {
            "dashboard" => "Dashboard & Analytics",
            "projects" => "Projects Management",
            "tasks" => "Task Tracking",
            "milestones" => "Project Milestones",
            "timelogs" => "Time Tracking",
            "documents" => "Document Management",
            "companies" => "Company Directory",
            "team" => "Team & HR",
            "reports" => "Analytics & Reports",
            "settings" => "System Settings",
            "notifications" => "Notifications",
            _ => char.ToUpper(module[0]) + module.Substring(1)
        };
    }

    private static PermissionDto AllAccess() => new()
    {
        CanView = true,
        CanCreate = true,
        CanEdit = true,
        CanDelete = true
    };

    private static bool IsValidUpdate(PermissionUpdateDto update) =>
        Roles.Contains(update.RoleName) && Modules.Contains(update.Module);
}
