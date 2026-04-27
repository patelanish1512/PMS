using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectProgress.Application.DTOs;

namespace ProjectProgress.Application.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllProjectsAsync();
    Task<ProjectDto?> GetProjectByIdAsync(string id);
    Task<ProjectDto> CreateProjectAsync(ProjectDto projectDto);
}
