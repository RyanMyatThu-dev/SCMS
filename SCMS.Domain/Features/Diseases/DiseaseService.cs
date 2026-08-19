using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Shared;
using SCMS.Domain.Features.Diseases.Models;

namespace SCMS.Domain.Features.Diseases
{
    public class DiseaseService : IDiseaseService
    {
        private readonly AppDbContext _context;

        public DiseaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<GetDiseasesResponse>> GetDiseasesAsync(GetDiseasesRequest request)
        {   
            var query = _context.TblDiseases
                .AsNoTracking()
                .Where(d => d.DeleteFlag != true);

            var totalCount = await query.CountAsync();

            var diseases = await query
                .OrderBy(d => d.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(d => new GetDiseasesResponse
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description
                })
                .ToListAsync();

            return PagedResult<GetDiseasesResponse>.Success(diseases, new Pagination(request.PageNumber, request.PageSize, totalCount));
        }

        public async Task<PagedResult<SearchDiseasesResponse>> SearchDiseasesAsync(SearchDiseasesRequest request)
        {
            var query = _context.TblDiseases
                .AsNoTracking()
                .Where(d => d.DeleteFlag != true);

            if (!string.IsNullOrWhiteSpace(request.Query))
            {
                var q = request.Query.Trim().ToLower();
                query = query.Where(d => 
                    d.Name.ToLower().Contains(q) || 
                    (d.Description != null && d.Description.ToLower().Contains(q)));
            }

            var totalCount = await query.CountAsync();

            var diseases = await query
                .OrderBy(d => d.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(d => new SearchDiseasesResponse
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description
                })
                .ToListAsync();

            return PagedResult<SearchDiseasesResponse>.Success(diseases, new Pagination(request.PageNumber, request.PageSize, totalCount));
        }

        public async Task<Result<CreateDiseaseResponse>> CreateDiseaseAsync(CreateDiseaseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result<CreateDiseaseResponse>.Failure("Disease name is required.");
            }

            var trimmedName = request.Name.Trim();
            var lowerName = trimmedName.ToLower();

            // Check if disease with same name already exists (case-insensitive)
            var diseaseExists = await _context.TblDiseases
                .AnyAsync(d => d.Name.ToLower() == lowerName && d.DeleteFlag != true);
            if (diseaseExists)
            {
                return Result<CreateDiseaseResponse>.Failure("A disease with this name already exists.");
            }

            var disease = new TblDisease
            {
                Name = trimmedName,
                Description = request.Description?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblDiseases.Add(disease);
            await _context.SaveChangesAsync();

            return Result<CreateDiseaseResponse>.Success(new CreateDiseaseResponse
            {
                Id = disease.Id,
                Name = disease.Name,
                Description = disease.Description
            }, "Disease created successfully.");
        }

        public async Task<Result<UpdateDiseaseResponse>> UpdateDiseaseAsync(UpdateDiseaseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result<UpdateDiseaseResponse>.Failure("Disease name is required.");
            }

            var disease = await _context.TblDiseases.FirstOrDefaultAsync(d => d.Id == request.Id && d.DeleteFlag != true);
            if (disease == null)
            {
                return Result<UpdateDiseaseResponse>.Failure("Disease to update not found");
            }

            var trimmedName = request.Name.Trim();
            var lowerName = trimmedName.ToLower();

            var nameConflict = await _context.TblDiseases
                .AnyAsync(d => d.Id != request.Id && d.Name.ToLower() == lowerName && d.DeleteFlag != true);
            if (nameConflict)
            {
                return Result<UpdateDiseaseResponse>.Failure("Another active disease with this name already exists.");
            }

            disease.Name = trimmedName;
            disease.Description = request.Description?.Trim();
            disease.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Result<UpdateDiseaseResponse>.Success(new UpdateDiseaseResponse
            {
                Id = disease.Id,
                Name = disease.Name,
                Description = disease.Description
            }, "Disease updated successfully.");
        }

        public async Task<Result<bool>> DeactivateDiseaseAsync(int id)
        {
            var disease = await _context.TblDiseases
                .FirstOrDefaultAsync(d => d.Id == id && d.DeleteFlag != true);
            if (disease == null)
            {
                return Result<bool>.Failure("Disease not found.");
            }

            // Check if disease is referenced in any active prescriptions
            var isReferenced = await _context.TblPrescriptions
                .AnyAsync(p => p.DiseaseId == id && p.DeleteFlag != true);
            if (isReferenced)
            {
                return Result<bool>.Failure("Cannot deactivate disease as it is referenced in active prescriptions.");
            }

            disease.DeleteFlag = true;
            disease.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Result<bool>.Success(true, "Disease deactivated successfully.");
        }
    }
}
