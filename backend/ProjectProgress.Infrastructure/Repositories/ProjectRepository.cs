using System.Collections.Generic;
using System.Threading.Tasks;
using MongoDB.Driver;
using ProjectProgress.Application.Interfaces.Repositories;
using ProjectProgress.Domain.Entities;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Infrastructure.Repositories;

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
}
