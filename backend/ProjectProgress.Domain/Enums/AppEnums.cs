namespace ProjectProgress.Domain.Enums;

public enum UserRole
{
    Admin,
    ProjectManager,
    Member,
    Client
}

public enum ProjectStatus
{
    Planned,
    Active,
    OnHold,
    Completed,
    Cancelled
}

public enum TaskStatus
{
    ToDo,
    InProgress,
    Blocked,
    Done
}

public enum Priority
{
    Critical,
    High,
    Medium,
    Low
}
