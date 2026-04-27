using Microsoft.Extensions.Options;
using MongoDB.Driver;
using ProgressMonitoringBackend.Domain.Entities;

namespace ProgressMonitoringBackend.Infrastructure.Mongo;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        _database = client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoCollection<T> Collection<T>(string collectionName) =>
        _database.GetCollection<T>(collectionName);

    public IMongoCollection<AttachmentItem> Documents => _database.GetCollection<AttachmentItem>("attachments");
    public IMongoCollection<Company> Companies => _database.GetCollection<Company>("companies");
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Project> Projects => _database.GetCollection<Project>("projects");
    public IMongoCollection<Milestone> Milestones => _database.GetCollection<Milestone>("milestones");
    public IMongoCollection<TaskItem> Tasks => _database.GetCollection<TaskItem>("tasks");
    public IMongoCollection<TimeLog> TimeLogs => _database.GetCollection<TimeLog>("timeLogs");
    public IMongoCollection<ProgressUpdate> ProgressUpdates => _database.GetCollection<ProgressUpdate>("progressUpdates");
    public IMongoCollection<AttachmentItem> Attachments => _database.GetCollection<AttachmentItem>("attachments");
    public IMongoCollection<NotificationItem> Notifications => _database.GetCollection<NotificationItem>("notifications");
    public IMongoCollection<SystemSettings> Settings => _database.GetCollection<SystemSettings>("settings");
    public IMongoCollection<RolePermission> RolePermissions => _database.GetCollection<RolePermission>("rolePermissions");
}
