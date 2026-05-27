using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Shared;
using SCMS.Shared.Contracts.Diseases;

namespace SCMS.Domain.Features.Diseases
{
    public class DiseaseService
    {
        private readonly ScmsDbContext _context;

        public DiseaseService(ScmsDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<DiseaseResponse>> GetDiseasesAsync(string? query, PaginationRequest paginationRequest)
        {
            var diseasesQuery = _context.TblDiseases.Where(d => d.DeleteFlag != true);
            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.Trim().ToLowerInvariant();
                diseasesQuery = diseasesQuery.Where(d => d.Name.ToLower().Contains(q)
                    || (d.Description != null && d.Description.ToLower().Contains(q)));
            }

            var totalCount = await diseasesQuery.CountAsync();
            var list = await diseasesQuery
                .OrderBy(d => d.Name)
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .Select(d => new DiseaseResponse
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description
                })
                .ToListAsync();

            return PagedResult<DiseaseResponse>.Success(list, new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount));
        }
    }
}
