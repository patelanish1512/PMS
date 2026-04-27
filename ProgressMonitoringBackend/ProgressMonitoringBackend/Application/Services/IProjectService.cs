using ProgressMonitoringBackend.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Application.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllProjectsAsync();
    Task<ProjectDto?> GetProjectByIdAsync(string id);
    Task<ProjectDto> CreateProjectAsync(ProjectDto projectDto);
}
