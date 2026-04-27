using ProgressMonitoringBackend.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Application.Interfaces.Repositories;

public interface IProjectRepository
{
    Task<List<Project>> GetAllAsync();
    Task<Project?> GetByIdAsync(string id);
    Task AddAsync(Project project);
    Task UpdateAsync(string id, Project project);
    Task DeleteAsync(string id);
}
