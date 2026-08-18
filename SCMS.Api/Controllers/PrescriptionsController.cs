using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Prescriptions;
using SCMS.Domain.Features.Prescriptions.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PrescriptionsController : ControllerBase
    {
        private readonly IPrescriptionService _prescriptionService;
        private readonly IPdfDocumentService _pdfDocumentService;

        public PrescriptionsController(IPrescriptionService prescriptionService, IPdfDocumentService pdfDocumentService)
        {
            _prescriptionService = prescriptionService;
            _pdfDocumentService = pdfDocumentService;
        }

        /// <summary>Create a clinical prescription and dispense inventory stock.</summary>
        [HttpPost]
        [HasPermission("Prescriptions.Create")]
        [ProducesResponseType(typeof(Result<PrescriptionResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
        {
            var result = await _prescriptionService.CreatePrescriptionAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Get detailed prescription by prescription ID.</summary>
        [HttpGet("prescriptions/{id:int}")]
        [HasPermission("Prescriptions.View")]
        [ProducesResponseType(typeof(Result<PrescriptionResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPrescriptionDetails(int id)
        {
            var result = await _prescriptionService.GetPrescriptionDetailsAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Query prescriptions for a patient with pagination.</summary>
        [HttpGet]
        [HasPermission("Prescriptions.View")]
        [ProducesResponseType(typeof(PagedResult<PrescriptionResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPrescriptions([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetPrescriptionsAsync(patientId, paginationRequest);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Create or update a reusable medication prescription template.</summary>
        [HttpPost("templates")]
        [HasPermission("Prescriptions.Create")]
        [ProducesResponseType(typeof(Result<PrescriptionTemplateResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SaveTemplate([FromBody] SaveTemplateRequest request)
        {
            var result = await _prescriptionService.SaveTemplateAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>List prescription templates filtered optionally by disease.</summary>
        [HttpGet("templates")]
        [HasPermission("Prescriptions.View")]
        [ProducesResponseType(typeof(PagedResult<PrescriptionTemplateResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetTemplates([FromQuery] int? diseaseId, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetTemplatesAsync(diseaseId, paginationRequest);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Delete a prescription template by ID.</summary>
        [HttpDelete("templates/{id:int}")]
        [HasPermission("Prescriptions.Delete")]
        [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var result = await _prescriptionService.DeleteTemplateAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Generate and download printable PDF prescription slip.</summary>
        [HttpGet("{id:int}/pdf")]
        [HasPermission("Prescriptions.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetPrescriptionPdf(int id)
        {
            var result = await _prescriptionService.GetPrescriptionDetailsAsync(id);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreatePrescriptionPdf(result.Data);
            return File(bytes, "application/pdf", $"prescription-{id}.pdf");
        }
    }
}
