using System.ComponentModel.DataAnnotations;

namespace ProgressMonitoringBackend.Application.DTOs;

public class CompanyDto
{
    public string Id { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Industry { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    [Required]
    public string ContactPerson { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    public string Phone { get; set; } = string.Empty;
    public CompanyProjectsDto Projects { get; set; } = new();
    public decimal Budget { get; set; }
    public int Completion { get; set; }
    public string Status { get; set; } = "active";
}


public class CompanyProjectsDto
{
    public int Active { get; set; }
    public int Completed { get; set; }
    public int Total { get; set; }
}
