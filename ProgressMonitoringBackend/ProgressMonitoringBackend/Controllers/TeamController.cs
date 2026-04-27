using Microsoft.AspNetCore.Mvc;
using ProgressMonitoringBackend.Attributes;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using ProgressMonitoringBackend.Application.DTOs;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamController : ControllerBase
{
    private readonly MongoDbContext _context;

    public TeamController(MongoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [RequirePermission("team", "CanView")]
    public async Task<ActionResult<List<UserDto>>> GetTeam()
    {
        var users = await _context.Users.Find(_ => true).ToListAsync();
        return Ok(users.Select(u => new UserDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.Role.ToString(),
            Avatar = u.Avatar,
            Status = u.Status,
            JoinedDate = u.CreatedAt.ToString("yyyy-MM-dd")
        }).ToList());
    }
}
