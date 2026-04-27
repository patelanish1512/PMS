using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ProgressMonitoringBackend.Application.Interfaces.Repositories;
using ProgressMonitoringBackend.Domain.Entities;
using ProgressMonitoringBackend.Infrastructure.Mongo;

namespace ProgressMonitoringBackend.Infrastructure.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly MongoDbContext _context;

    public ProjectRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<List<Project>> GetAllAsync()
    {
        return await _context.Projects.Find(_ => true).ToListAsync();
    }

    public async Task<Project?> GetByIdAsync(string id)
    {
        return await _context.Projects.Find(p => p.Id == id).FirstOrDefaultAsync();
    }

    public async Task AddAsync(Project project)
    {
        await _context.Projects.InsertOneAsync(project);
    }

    public async Task UpdateAsync(string id, Project project)
    {
        await _context.Projects.ReplaceOneAsync(p => p.Id == id, project);
    }

    public async Task DeleteAsync(string id)
    {
        await _context.Projects.DeleteOneAsync(p => p.Id == id);
    }
}
