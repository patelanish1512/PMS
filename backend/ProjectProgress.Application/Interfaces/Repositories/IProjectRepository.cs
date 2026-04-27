using System.Collections.Generic;
using System.Threading.Tasks;
using ProjectProgress.Domain.Entities;

namespace ProjectProgress.Application.Interfaces.Repositories;

public interface IProjectRepository
{
    Task<List<Project>> GetAllAsync();
    Task<Project?> GetByIdAsync(string id);
    Task AddAsync(Project project);
}

