using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using SCMS.Domain.Security;
using SCMS.Shared;
using SCMS.Shared.Contracts.Medicines;

namespace SCMS.Domain.Features.Medicines
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class MedicinesController : ControllerBase
    {
        private readonly IMedicineService _medicineService;

        public MedicinesController(IMedicineService medicineService)
        {
            _medicineService = medicineService;
        }

        [HttpGet]
        [HasPermission("Medicines.View")]
        public async Task<IActionResult> SearchMedicines([FromQuery] string? query, [FromQuery] PaginationRequest paginationRequest)
        {
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _medicineService.SearchMedicinesAsync(query, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("quarantine-expired")]
        [HasPermission("Medicines.AdjustStock")]
        public async Task<IActionResult> QuarantineExpiredBatches()
        {
            var result = await _medicineService.QuarantineExpiredBatchesAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("alerts")]
        [HasPermission("Medicines.View")]
        public async Task<IActionResult> GetInventoryAlerts([FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _medicineService.GetInventoryAlertsAsync(paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        // ────────────────────────────────────────────────────────────────
        // Medicine Batch CRUD endpoints
        // ────────────────────────────────────────────────────────────────

        [HttpGet("batches")]
        [HasPermission("Medicines.View")]
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
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("batches/{id}")]
        [HasPermission("Medicines.View")]
        public async Task<IActionResult> GetBatch(int id)
        {
            var result = await _medicineService.GetBatchByIdAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("batches")]
        [HasPermission("Medicines.Create")]
        public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest request)
        {
            var result = await _medicineService.CreateBatchAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("batches/{id}")]
        [HasPermission("Medicines.Update")]
        public async Task<IActionResult> UpdateBatch(int id, [FromBody] UpdateBatchRequest request)
        {
            var result = await _medicineService.UpdateBatchAsync(id, request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("batches/{id}")]
        [HasPermission("Medicines.Delete")]
        public async Task<IActionResult> DeleteBatch(int id, [FromQuery] bool force = false)
        {
            var result = await _medicineService.DeleteBatchAsync(id, force);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("categories")]
        [HasPermission("Medicines.View")]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _medicineService.GetCategoriesAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost]
        [HasPermission("Medicines.Create")]
        public async Task<IActionResult> CreateMedicine([FromForm] CreateMedicineRequest request, IFormFile? image)
        {
            var result = await _medicineService.CreateMedicineAsync(request, image);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPut("{id}")]
        [HasPermission("Medicines.Update")]
        public async Task<IActionResult> UpdateMedicine(int id, [FromForm] UpdateMedicineRequest request, IFormFile? image)
        {
            var result = await _medicineService.UpdateMedicineAsync(id, request, image);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [HasPermission("Medicines.Delete")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var result = await _medicineService.DeleteMedicineAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
