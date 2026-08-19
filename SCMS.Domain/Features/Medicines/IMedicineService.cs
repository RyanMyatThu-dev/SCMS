using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;
using SCMS.Domain.Features.Medicines.Models;

namespace SCMS.Domain.Features.Medicines
{
    public interface IMedicineService
    {
        Task<PagedResult<GetMedicinesResponse>> GetMedicinesAsync(GetMedicinesRequest request);
        Task<PagedResult<SearchMedicinesResponse>> SearchMedicinesAsync(SearchMedicinesRequest request);
        Task<Result<CreateMedicineResponse>> CreateMedicineAsync(CreateMedicineRequest request, IFormFile? imageFile);
        Task<Result<UpdateMedicineResponse>> UpdateMedicineAsync(int id, UpdateMedicineRequest request, IFormFile? imageFile);
        Task<Result> DeleteMedicineAsync(int id);
        Task<Result<List<MedicineCategoryResponse>>> GetCategoriesAsync();
        Task<PagedResult<InventoryAlertResponse>> GetInventoryAlertsAsync(PaginationRequest paginationRequest);
        Task CreateInventoryAlertNotificationsAsync();
        Task<Result> QuarantineExpiredBatchesAsync();
        Task<PagedResult<GetBatchesResponse>> GetBatchesAsync(GetBatchesRequest request);
        Task<PagedResult<SearchBatchesResponse>> SearchBatchesAsync(SearchBatchesRequest request);
        Task<Result<GetBatchByIdResponse>> GetBatchByIdAsync(int id);
        Task<Result<CreateBatchResponse>> CreateBatchAsync(CreateBatchRequest request);
        Task<Result<UpdateBatchResponse>> UpdateBatchAsync(int id, UpdateBatchRequest request);
        Task<Result> DeleteBatchAsync(int id, bool force = false);
    }
}
