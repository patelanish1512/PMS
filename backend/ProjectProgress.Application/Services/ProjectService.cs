using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Application.Interfaces.Repositories;

namespace ProjectProgress.Application.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepository;

    public ProjectService(IProjectRepository projectRepository)
    {
        _projectRepository = projectRepository;
    }

    public async Task<List<ProjectDto>> GetAllProjectsAsync()
    {
        var projects = await _projectRepository.GetAllAsync();
        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(string id)
    {
        var project = await _projectRepository.GetByIdAsync(id);
        return project == null ? null : MapToDto(project);
    }

    public async Task<ProjectDto> CreateProjectAsync(ProjectDto projectDto)
    {
        var project = new ProjectProgress.Domain.Entities.Project
        {
            Name = projectDto.Name,
            CompanyName = projectDto.Company,
            Description = projectDto.Description ?? projectDto.Name,
            Status = ProjectProgress.Domain.Enums.ProjectStatus.Active,
            Health = "on-track",
            Progress = 0,
            Budget = projectDto.Budget,
            Spent = 0,
            StartDate = DateTime.TryParse(projectDto.StartDate, out var sd) ? sd : DateTime.UtcNow,
            EndDate = DateTime.TryParse(projectDto.EndDate, out var ed) ? ed : DateTime.UtcNow.AddMonths(3),
            TeamCount = projectDto.Team,
            ManagerId = projectDto.ManagerId ?? "admin",
            ManagerName = projectDto.ManagerName ?? "Admin User"
        };


        await _projectRepository.AddAsync(project);
        return MapToDto(project);
    }

    private ProjectDto MapToDto(ProjectProgress.Domain.Entities.Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Company = project.CompanyName,
            ManagerId = project.ManagerId,
            ManagerName = project.ManagerName,
            Status = project.Status.ToString().ToLower(),

            Health = project.Health,
            Progress = project.Progress,
            Budget = project.Budget,
            Spent = project.Spent,
            StartDate = project.StartDate.ToString("yyyy-MM-dd"),
            EndDate = project.EndDate.ToString("yyyy-MM-dd"),
            Team = project.TeamCount,
            Tasks = new TaskSummaryDto
            {
                Total = project.TaskSummary.Total,
                Completed = project.TaskSummary.Completed,
                InProgress = project.TaskSummary.InProgress,
                Blocked = project.TaskSummary.Blocked
            },
            Milestones = new MilestoneSummaryDto
            {
                Total = project.MilestoneSummary.Total,
                Completed = project.MilestoneSummary.Completed
            }
        };
    }

}
