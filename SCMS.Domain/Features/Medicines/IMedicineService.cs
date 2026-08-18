using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;
using SCMS.Domain.Features.Medicines.Models;

namespace SCMS.Domain.Features.Medicines
{
    public interface IMedicineService
    {
        Task<PagedResult<MedicineSearchResponse>> SearchMedicinesAsync(string? query, PaginationRequest paginationRequest);
        Task<Result> QuarantineExpiredBatchesAsync();
        Task<PagedResult<InventoryAlertResponse>> GetInventoryAlertsAsync(PaginationRequest paginationRequest);
        Task CreateInventoryAlertNotificationsAsync();
        Task<PagedResult<BatchDetailResponse>> GetBatchesAsync(string? query, string? status, int? medicineId, string? sortBy, bool sortDescending, PaginationRequest paginationRequest);
        Task<Result<BatchDetailResponse>> GetBatchByIdAsync(int id);
        Task<Result<BatchDetailResponse>> CreateBatchAsync(CreateBatchRequest request);
        Task<Result<BatchDetailResponse>> UpdateBatchAsync(int id, UpdateBatchRequest request);
        Task<Result> DeleteBatchAsync(int id, bool force = false);
        Task<Result<List<MedicineCategoryResponse>>> GetCategoriesAsync();
        Task<Result<MedicineSearchResponse>> CreateMedicineAsync(CreateMedicineRequest request, IFormFile? imageFile);
        Task<Result<MedicineSearchResponse>> UpdateMedicineAsync(int id, UpdateMedicineRequest request, IFormFile? imageFile);
        Task<Result> DeleteMedicineAsync(int id);
    }
}
