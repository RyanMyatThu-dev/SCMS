using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Medicines;
using SCMS.Domain.Features.Medicines.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class MedicinesController : ControllerBase
    {
        private readonly IMedicineService _medicineService;

        public MedicinesController(IMedicineService medicineService)
        {
            _medicineService = medicineService;
        }

        /// <summary>Search and list medicines with stock totals and alert flags.</summary>
        [HttpGet]
        [HasPermission("Medicines.View")]
        [ProducesResponseType(typeof(PagedResult<MedicineSearchResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SearchMedicines([FromQuery] string? query, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _medicineService.SearchMedicinesAsync(query, paginationRequest);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Scan and automatically quarantine any expired medication batches.</summary>
        [HttpPost("quarantine-expired")]
        [HasPermission("Medicines.AdjustStock")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> QuarantineExpiredBatches()
        {
            var result = await _medicineService.QuarantineExpiredBatchesAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Retrieve low stock and nearing expiry inventory alerts.</summary>
        [HttpGet("alerts")]
        [HasPermission("Medicines.View")]
        [ProducesResponseType(typeof(PagedResult<InventoryAlertResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetInventoryAlerts([FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _medicineService.GetInventoryAlertsAsync(paginationRequest);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Query medicine batches with filtering, sorting, and pagination.</summary>
        [HttpGet("batches")]
        [HasPermission("Medicines.View")]
        [ProducesResponseType(typeof(PagedResult<BatchDetailResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetBatches(
            [FromQuery] string? query,
            [FromQuery] string? status,
            [FromQuery] int? medicineId,
            [FromQuery] string? sortBy,
            [FromQuery] bool sortDescending = false,
            [FromQuery] PaginationRequest? paginationRequest = null)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _medicineService.GetBatchesAsync(query, status, medicineId, sortBy, sortDescending, paginationRequest);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Get medicine batch details by batch ID.</summary>
        [HttpGet("batches/{id:int}")]
        [HasPermission("Medicines.View")]
        [ProducesResponseType(typeof(Result<BatchDetailResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetBatch(int id)
        {
            var result = await _medicineService.GetBatchByIdAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Create a new medicine batch.</summary>
        [HttpPost("batches")]
        [HasPermission("Medicines.Create")]
        [ProducesResponseType(typeof(Result<BatchDetailResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest request)
        {
            var result = await _medicineService.CreateBatchAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Update an existing medicine batch.</summary>
        [HttpPut("batches/{id:int}")]
        [HasPermission("Medicines.Update")]
        [ProducesResponseType(typeof(Result<BatchDetailResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateBatch(int id, [FromBody] UpdateBatchRequest request)
        {
            var result = await _medicineService.UpdateBatchAsync(id, request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Delete or soft-delete a medicine batch.</summary>
        [HttpDelete("batches/{id:int}")]
        [HasPermission("Medicines.Delete")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteBatch(int id, [FromQuery] bool force = false)
        {
            var result = await _medicineService.DeleteBatchAsync(id, force);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>List medicine categories.</summary>
        [HttpGet("categories")]
        [HasPermission("Medicines.View")]
        [ProducesResponseType(typeof(Result<List<MedicineCategoryResponse>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _medicineService.GetCategoriesAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Create a new medicine catalog entry with optional photo upload.</summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [HasPermission("Medicines.Create")]
        [ProducesResponseType(typeof(Result<MedicineSearchResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateMedicine([FromForm] CreateMedicineRequest request, IFormFile? image)
        {
            var result = await _medicineService.CreateMedicineAsync(request, image);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Update an existing medicine catalog entry with optional photo upload.</summary>
        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        [HasPermission("Medicines.Update")]
        [ProducesResponseType(typeof(Result<MedicineSearchResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateMedicine(int id, [FromForm] UpdateMedicineRequest request, IFormFile? image)
        {
            var result = await _medicineService.UpdateMedicineAsync(id, request, image);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Delete or deactivate a medicine catalog entry.</summary>
        [HttpDelete("{id:int}")]
        [HasPermission("Medicines.Delete")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var result = await _medicineService.DeleteMedicineAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }
    }
}
