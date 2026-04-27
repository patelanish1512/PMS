using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ProjectProgress.Domain.Entities;
using ProjectProgress.Domain.Enums;

namespace ProjectProgress.Infrastructure.Services;

public class DbSeeder
{
    private readonly Mongo.MongoDbContext _context;
    public DbSeeder(Mongo.MongoDbContext context) => _context = context;

    public async System.Threading.Tasks.Task SeedAsync()
    {
        // --- Companies ---
        if (!await _context.Companies.Find(_ => true).AnyAsync())
        {
            var companies = new List<Company>
            {
                new() { Name = "Tech Corp", Industry = "Technology", Address = "123 Silicon Valley, CA 94025", ContactPerson = "John Smith", ContactEmail = "john.smith@techcorp.com", ContactPhone = "+1 (555) 123-4567" },
                new() { Name = "StartupXYZ", Industry = "E-commerce", Address = "456 Market Street, San Francisco, CA 94102", ContactPerson = "Sarah Johnson", ContactEmail = "sarah@startupxyz.com", ContactPhone = "+1 (555) 234-5678" },
                new() { Name = "Enterprise Ltd", Industry = "Finance", Address = "789 Wall Street, New York, NY 10005", ContactPerson = "Michael Brown", ContactEmail = "michael@enterprise.com", ContactPhone = "+1 (555) 345-6789" }
            };
            await _context.Companies.InsertManyAsync(companies);
        }

        // --- Users ---
        var demoPassword = BCrypt.Net.BCrypt.HashPassword("Password@123");
        var adminUser = await _context.Users.Find(u => u.Email == "admin@example.com").FirstOrDefaultAsync();
        
        var usersToSeed = new List<User>
        {
            new() { FullName = "Admin User", Email = "admin@example.com", PasswordHash = demoPassword, Role = UserRole.Admin, Designation = "System Administrator", Avatar = "AU", Status = "active" },
            new() { FullName = "Project Manager", Email = "manager@example.com", PasswordHash = demoPassword, Role = UserRole.ProjectManager, Designation = "Project Lead", Avatar = "PM", Status = "active" },
            new() { FullName = "David Lee", Email = "david.lee@company.com", PasswordHash = demoPassword, Role = UserRole.ProjectManager, Designation = "Full Stack Developer", Avatar = "DL", Status = "active" },
            new() { FullName = "Sarah Chen", Email = "sarah.chen@company.com", PasswordHash = demoPassword, Role = UserRole.Member, Designation = "Senior UI/UX Designer", Avatar = "SC", Status = "active" },
            new() { FullName = "Team Member", Email = "member@example.com", PasswordHash = demoPassword, Role = UserRole.Member, Designation = "Developer", Avatar = "TM", Status = "active" },
            new() { FullName = "Client User", Email = "client@example.com", PasswordHash = demoPassword, Role = UserRole.Client, Designation = "External Client", Avatar = "CL", Status = "active" }
        };

        foreach (var user in usersToSeed)
        {
            var existingUser = await _context.Users.Find(u => u.Email == user.Email).FirstOrDefaultAsync();
            if (existingUser == null)
            {
                await _context.Users.InsertOneAsync(user);
            }
            else
            {
                var update = Builders<User>.Update.Set(u => u.PasswordHash, demoPassword);
                await _context.Users.UpdateOneAsync(u => u.Id == existingUser.Id, update);
            }
        }


        // --- Projects, Tasks, etc. ---
        if (!await _context.Projects.Find(_ => true).AnyAsync())
        {
            var companies = await _context.Companies.Find(_ => true).ToListAsync();
            var users = await _context.Users.Find(_ => true).ToListAsync();

            if (companies.Count > 0 && users.Count > 0)
            {
                var projects = new List<Project>
                {
                    new() { Name = "Website Redesign", CompanyId = companies[0].Id, CompanyName = companies[0].Name, ManagerId = users[0].Id, ManagerName = users[0].FullName, Status = ProjectStatus.Active, Health = "on-track", Progress = 75, Budget = 125000, Spent = 93750, StartDate = new DateTime(2026,1,15), EndDate = new DateTime(2026,5,15), TeamCount = 8, TaskSummary = new TaskSummary { Total=45, Completed=34, InProgress=8, Blocked=3 }, MilestoneSummary = new MilestoneSummary { Total=6, Completed=4 } }
                };
                await _context.Projects.InsertManyAsync(projects);
            }
        }

        // --- Indexes ---
        await _context.Projects.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Project>(Builders<Project>.IndexKeys.Ascending(p => p.CompanyId)),
            new CreateIndexModel<Project>(Builders<Project>.IndexKeys.Ascending(p => p.Status))
        });
        await _context.Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Email), new CreateIndexOptions { Unique = true }));
    }
}
