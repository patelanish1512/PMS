using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using ProjectProgress.Application.DTOs;
using ProjectProgress.Infrastructure.Mongo;

namespace ProjectProgress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class CompaniesController : ControllerBase
{

    private readonly MongoDbContext _context;
    public CompaniesController(MongoDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<List<CompanyDto>>> GetCompanies()
    {
        var companies = await _context.Companies.Find(_ => true).ToListAsync();
        var projects = await _context.Projects.Find(_ => true).ToListAsync();

        var dtos = companies.Select(c =>
        {
            var companyProjects = projects.Where(p => p.CompanyId == c.Id).ToList();
            return new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                Industry = c.Industry,
                Address = c.Address,
                ContactPerson = c.ContactPerson,
                Email = c.ContactEmail,
                Phone = c.ContactPhone,
                Projects = new CompanyProjectsDto
                {
                    Active = companyProjects.Count(p => p.Status == Domain.Enums.ProjectStatus.Active),
                    Completed = companyProjects.Count(p => p.Status == Domain.Enums.ProjectStatus.Completed),
                    Total = companyProjects.Count
                },
                Budget = companyProjects.Sum(p => p.Budget),
                Completion = companyProjects.Count > 0
                    ? (int)companyProjects.Average(p => p.Progress)
                    : 0
            };
        }).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompanyDto>> GetCompany(string id)
    {
        var company = await _context.Companies.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (company == null) return NotFound();
        return Ok(new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            Industry = company.Industry,
            Address = company.Address,
            ContactPerson = company.ContactPerson,
            Email = company.ContactEmail,
            Phone = company.ContactPhone
        });
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> CreateCompany([FromBody] CompanyDto dto)
    {
        var company = new Domain.Entities.Company
        {
            Name = dto.Name,
            Industry = dto.Industry,
            Address = dto.Address,
            ContactPerson = dto.ContactPerson,
            ContactEmail = dto.Email,
            ContactPhone = dto.Phone
        };
        await _context.Companies.InsertOneAsync(company);
        dto.Id = company.Id;
        return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCompany(string id, [FromBody] CompanyDto dto)
    {
        var update = Builders<Domain.Entities.Company>.Update
            .Set(c => c.Name, dto.Name)
            .Set(c => c.Industry, dto.Industry)
            .Set(c => c.Address, dto.Address)
            .Set(c => c.ContactPerson, dto.ContactPerson)
            .Set(c => c.ContactEmail, dto.Email)
            .Set(c => c.ContactPhone, dto.Phone)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);
        var result = await _context.Companies.UpdateOneAsync(c => c.Id == id, update);
        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCompany(string id)

    {
        var result = await _context.Companies.DeleteOneAsync(c => c.Id == id);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
