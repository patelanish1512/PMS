using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ProgressMonitoringBackend.Domain.Entities;
using ProgressMonitoringBackend.Domain.Enums;
using ProgressMonitoringBackend.Infrastructure.Mongo;

namespace ProgressMonitoringBackend.Infrastructure.Services;

public class DbSeeder
{
    private readonly MongoDbContext _context;
    private static readonly string[] Modules = ["dashboard", "projects", "tasks", "milestones", "timelogs", "documents", "companies", "team", "reports", "settings", "notifications"];
    private static readonly string[] Roles = ["Admin", "ProjectManager", "Member", "Client"];

    public DbSeeder(MongoDbContext context) => _context = context;

    public async System.Threading.Tasks.Task EnsureIndexesAsync()
    {
        await _context.Projects.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Project>(Builders<Project>.IndexKeys.Ascending(p => p.CompanyId)),
            new CreateIndexModel<Project>(Builders<Project>.IndexKeys.Ascending(p => p.Status))
        });

        await _context.Tasks.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<TaskItem>(Builders<TaskItem>.IndexKeys.Ascending(t => t.ProjectId)),
            new CreateIndexModel<TaskItem>(Builders<TaskItem>.IndexKeys.Ascending(t => t.Status))
        });

        await _context.Notifications.Indexes.CreateOneAsync(
            new CreateIndexModel<NotificationItem>(Builders<NotificationItem>.IndexKeys.Ascending(n => n.UserId)));

        await _context.Users.Indexes.CreateOneAsync(
            new CreateIndexModel<User>(Builders<User>.IndexKeys.Ascending(u => u.Email), new CreateIndexOptions { Unique = true }));

        await _context.RolePermissions.Indexes.CreateOneAsync(
            new CreateIndexModel<RolePermission>(
                Builders<RolePermission>.IndexKeys.Ascending(p => p.RoleName).Ascending(p => p.Module),
                new CreateIndexOptions { Unique = true }));
    }

    public async System.Threading.Tasks.Task EnsurePermissionDefaultsAsync()
    {
        foreach (var role in Roles)
        {
            foreach (var module in Modules)
            {
                var defaults = GetDefaultPermission(role, module);
                var filter = Builders<RolePermission>.Filter.And(
                    Builders<RolePermission>.Filter.Eq(p => p.RoleName, role),
                    Builders<RolePermission>.Filter.Eq(p => p.Module, module));

                var existing = await _context.RolePermissions.Find(filter).FirstOrDefaultAsync();
                if (existing == null)
                {
                    await _context.RolePermissions.InsertOneAsync(new RolePermission
                    {
                        RoleName = role,
                        Module = module,
                        CanView = defaults.CanView,
                        CanCreate = defaults.CanCreate,
                        CanEdit = defaults.CanEdit,
                        CanDelete = defaults.CanDelete,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                    continue;
                }

                if (role == "Admin")
                {
                    var update = Builders<RolePermission>.Update
                        .Set(p => p.CanView, true)
                        .Set(p => p.CanCreate, true)
                        .Set(p => p.CanEdit, true)
                        .Set(p => p.CanDelete, true)
                        .Set(p => p.UpdatedAt, DateTime.UtcNow);

                    await _context.RolePermissions.UpdateOneAsync(filter, update);
                }
            }
        }
    }

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
                    new() { Name = "Website Redesign", CompanyId = companies[0].Id, CompanyName = companies[0].Name, ManagerId = users[0].Id, ManagerName = users[0].FullName, Status = ProjectStatus.Active, Health = "on-track", Progress = 75, Budget = 125000, Spent = 93750, StartDate = new DateTime(2026,1,15), EndDate = new DateTime(2026,5,15), TeamCount = 8, TaskSummary = new TaskSummary { Total=45, Completed=34, InProgress=8, Blocked=3 }, MilestoneSummary = new MilestoneSummary { Total=6, Completed=4 } },
                    new() { Name = "Mobile App Beta", CompanyId = companies[1].Id, CompanyName = companies[1].Name, ManagerId = users[1].Id, ManagerName = users[1].FullName, Status = ProjectStatus.Active, Health = "at-risk", Progress = 30, Budget = 80000, Spent = 40000, StartDate = new DateTime(2026,3,1), EndDate = new DateTime(2026,8,1), TeamCount = 5, TaskSummary = new TaskSummary { Total=20, Completed=6, InProgress=10, Blocked=4 }, MilestoneSummary = new MilestoneSummary { Total=4, Completed=1 } }
                };
                await _context.Projects.InsertManyAsync(projects);

                var milestones = new List<Milestone>
                {
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, Title = "Design Phase Complete", Description = "All mockups approved", DueDate = DateTime.UtcNow.AddDays(10), Status = "pending", Progress = 0, Priority = Priority.High },
                    new() { ProjectId = projects[1].Id, ProjectName = projects[1].Name, Title = "Beta Release", Description = "First beta available", DueDate = DateTime.UtcNow.AddDays(30), Status = "pending", Progress = 0, Priority = Priority.High }
                };
                await _context.Milestones.InsertManyAsync(milestones);

                var tasks = new List<TaskItem>
                {
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, MilestoneId = milestones[0].Id, Title = "Create Login UI", Description = "Design the login screen", Status = ProgressMonitoringBackend.Domain.Enums.TaskStatus.ToDo, Priority = Priority.Medium, AssignedUserIds = new List<string> { users[3].Id }, AssigneeNames = new List<string> { users[3].FullName }, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(5) },
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, MilestoneId = milestones[0].Id, Title = "Setup API", Description = "Configure backend routes", Status = ProgressMonitoringBackend.Domain.Enums.TaskStatus.InProgress, Priority = Priority.High, AssignedUserIds = new List<string> { users[2].Id }, AssigneeNames = new List<string> { users[2].FullName }, StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddDays(2) },
                    new() { ProjectId = projects[1].Id, ProjectName = projects[1].Name, MilestoneId = milestones[1].Id, Title = "Write Tests", Description = "Unit tests for beta", Status = ProgressMonitoringBackend.Domain.Enums.TaskStatus.Done, Priority = Priority.Low, AssignedUserIds = new List<string> { users[4].Id }, AssigneeNames = new List<string> { users[4].FullName }, StartDate = DateTime.UtcNow.AddDays(-5), EndDate = DateTime.UtcNow.AddDays(-1) }
                };
                await _context.Tasks.InsertManyAsync(tasks);

                var timeLogs = new List<TimeLog>
                {
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, TaskName = tasks[0].Title, UserId = users[3].Id, UserName = users[3].FullName, HoursSpent = 4, LogDate = DateTime.UtcNow, Status = "approved", Description = "Worked on UI" },
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, TaskName = tasks[1].Title, UserId = users[2].Id, UserName = users[2].FullName, HoursSpent = 6.5, LogDate = DateTime.UtcNow.AddDays(-1), Status = "approved", Description = "Backend setup" }
                };
                await _context.TimeLogs.InsertManyAsync(timeLogs);

                var attachments = new List<AttachmentItem>
                {
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, TaskName = tasks[0].Title, FileName = "InitialDesign.pdf", FileType = "pdf", FileSize = 2500000, UploadedBy = users[3].Id, UploadedByName = users[3].FullName, UploadedAt = DateTime.UtcNow.AddDays(-2) },
                    new() { ProjectId = projects[0].Id, ProjectName = projects[0].Name, TaskName = tasks[1].Title, FileName = "Architecture.png", FileType = "png", FileSize = 1200000, UploadedBy = users[2].Id, UploadedByName = users[2].FullName, UploadedAt = DateTime.UtcNow.AddDays(-1) }
                };
                await _context.Attachments.InsertManyAsync(attachments);

                var notifications = new List<NotificationItem>
                {
                    new() { UserId = users[0].Id, Title = "New Project Assigned", Message = "You have been assigned to Website Redesign", Type = "project", IsRead = false },
                    new() { UserId = users[0].Id, Title = "Task Deadline", Message = "Create Login UI is due in 2 days", Type = "task", IsRead = false },
                    new() { UserId = users[0].Id, Title = "Time Log Approved", Message = "Your time log for yesterday has been approved", Type = "time", IsRead = true }
                };
                await _context.Notifications.InsertManyAsync(notifications);
            }
        }

        await EnsureIndexesAsync();
        await EnsurePermissionDefaultsAsync();

        // --- Permissions ---
        if (!await _context.RolePermissions.Find(_ => true).AnyAsync())
        {
            var permissions = new List<RolePermission>();

            void AddPerm(string role, string module, bool v, bool c, bool e, bool d)
            {
                permissions.Add(new RolePermission { RoleName = role, Module = module, CanView = v, CanCreate = c, CanEdit = e, CanDelete = d });
            }

            foreach (var mod in Modules)
            {
                if (mod == "reports") AddPerm("Admin", mod, true, false, false, false);
                else AddPerm("Admin", mod, true, true, true, true);

                if (mod == "projects" || mod == "tasks" || mod == "milestones" || mod == "timelogs" || mod == "documents")
                    AddPerm("ProjectManager", mod, true, true, true, true);
                else if (mod == "companies")
                    AddPerm("ProjectManager", mod, true, true, true, false);
                else if (mod == "team")
                    AddPerm("ProjectManager", mod, true, false, false, false);
                else if (mod == "reports" || mod == "notifications")
                    AddPerm("ProjectManager", mod, true, false, false, false);
                else
                    AddPerm("ProjectManager", mod, false, false, false, false);

                if (mod == "projects" || mod == "milestones" || mod == "companies")
                    AddPerm("Member", mod, true, false, false, false);
                else if (mod == "tasks")
                    AddPerm("Member", mod, true, false, true, false);
                else if (mod == "timelogs" || mod == "documents" || mod == "notifications")
                    AddPerm("Member", mod, true, true, false, false);
                else
                    AddPerm("Member", mod, false, false, false, false);

                if (mod == "dashboard" || mod == "projects" || mod == "milestones" || mod == "documents" || mod == "reports" || mod == "notifications")
                    AddPerm("Client", mod, true, false, false, false);
                else
                    AddPerm("Client", mod, false, false, false, false);
            }

            await _context.RolePermissions.InsertManyAsync(permissions);
        }
    }

    private static RolePermission GetDefaultPermission(string role, string module)
    {
        if (role == "Admin")
        {
            return new RolePermission { CanView = true, CanCreate = true, CanEdit = true, CanDelete = true };
        }

        if (module == "dashboard")
        {
            return new RolePermission { CanView = true };
        }

        if (role == "ProjectManager")
        {
            if (module is "projects" or "tasks" or "milestones" or "timelogs" or "documents")
                return new RolePermission { CanView = true, CanCreate = true, CanEdit = true, CanDelete = true };
            if (module == "companies")
                return new RolePermission { CanView = true, CanCreate = true, CanEdit = true };
            if (module is "team" or "reports" or "notifications")
                return new RolePermission { CanView = true };
        }

        if (role == "Member")
        {
            if (module is "projects" or "milestones" or "companies")
                return new RolePermission { CanView = true };
            if (module == "tasks")
                return new RolePermission { CanView = true, CanEdit = true };
            if (module is "timelogs" or "documents" or "notifications")
                return new RolePermission { CanView = true, CanCreate = true };
        }

        if (role == "Client" && module is "projects" or "milestones" or "documents" or "reports" or "notifications")
        {
            return new RolePermission { CanView = true };
        }

        return new RolePermission();
    }
}
