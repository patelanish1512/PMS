using MongoDB.Driver;
using ProgressMonitoringBackend.Application.Interfaces.Repositories;
using ProgressMonitoringBackend.Infrastructure.Mongo;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProgressMonitoringBackend.Infrastructure.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly IMongoCollection<T> _collection;

    public GenericRepository(MongoDbContext context, string collectionName)
    {
        _collection = context.Collection<T>(collectionName);
    }

    public virtual async Task<T?> GetByIdAsync(string id)
    {
        var filter = Builders<T>.Filter.Eq("Id", id);
        return await _collection.Find(filter).FirstOrDefaultAsync();
    }

    public virtual async Task<List<T>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public virtual async Task CreateAsync(T entity)
    {
        await _collection.InsertOneAsync(entity);
    }

    public virtual async Task UpdateAsync(string id, T entity)
    {
        var filter = Builders<T>.Filter.Eq("Id", id);
        await _collection.ReplaceOneAsync(filter, entity);
    }

    public virtual async Task DeleteAsync(string id)
    {
        var filter = Builders<T>.Filter.Eq("Id", id);
        await _collection.DeleteOneAsync(filter);
    }
}
