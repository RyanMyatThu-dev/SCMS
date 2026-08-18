using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;
using SCMS.Shared.Contracts.Medicines;

namespace SCMS.Domain.Features.Medicines
{
    public interface IMedicineService
    {
        Task<Result<PagedMedicineResponse>> SearchMedicinesAsync(string? query, PaginationRequest paginationRequest);
        Task<Result<int>> QuarantineExpiredBatchesAsync();
        Task<Result<PagedBatchResponse>> GetInventoryAlertsAsync(PaginationRequest paginationRequest);
        Task<Result<PagedBatchResponse>> GetBatchesAsync(string? query, string? status, int? medicineId, string? sortBy, bool sortDescending, PaginationRequest paginationRequest);
        Task<Result<MedicineBatchResponse>> GetBatchByIdAsync(int id);
        Task<Result<MedicineBatchResponse>> CreateBatchAsync(CreateBatchRequest request);
        Task<Result<MedicineBatchResponse>> UpdateBatchAsync(int id, UpdateBatchRequest request);
        Task<Result> DeleteBatchAsync(int id, bool force = false);
        Task<Result<IEnumerable<MedicineCategoryResponse>>> GetCategoriesAsync();
        Task<Result<MedicineResponse>> CreateMedicineAsync(CreateMedicineRequest request, IFormFile? image);
        Task<Result<MedicineResponse>> UpdateMedicineAsync(int id, UpdateMedicineRequest request, IFormFile? image);
        Task<Result> DeleteMedicineAsync(int id);
        Task<Result<MedicineResponse>> GetMedicineByIdAsync(int id);
    }
}
