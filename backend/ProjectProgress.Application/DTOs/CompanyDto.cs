namespace ProjectProgress.Application.DTOs;

public class CompanyDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public CompanyProjectsDto Projects { get; set; } = new();
    public decimal Budget { get; set; }
    public int Completion { get; set; }
}

public class CompanyProjectsDto
{
    public int Active { get; set; }
    public int Completed { get; set; }
    public int Total { get; set; }
}
