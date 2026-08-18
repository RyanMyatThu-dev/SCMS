using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Security;
using SCMS.Shared.Contracts.Prescriptions;
using SCMS.Shared;

namespace SCMS.Domain.Features.Prescriptions
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class PrescriptionsController : ControllerBase
    {
        private readonly PrescriptionService _prescriptionService;
        private readonly PdfDocumentService _pdfDocumentService;

        public PrescriptionsController(PrescriptionService prescriptionService, PdfDocumentService pdfDocumentService)
        {
            _prescriptionService = prescriptionService;
            _pdfDocumentService = pdfDocumentService;
        }

        [HttpPost]
        [HasPermission("Prescriptions.Create")]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
        {
            var result = await _prescriptionService.CreatePrescriptionAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("prescriptions/{id}")]
        [HasPermission("Prescriptions.View")]
        public async Task<IActionResult> GetPrescriptionDetails(int id)
        {
            var result = await _prescriptionService.GetPrescriptionDetailsAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        [HasPermission("Prescriptions.View")]
        public async Task<IActionResult> GetPrescriptions([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetPrescriptionsAsync(patientId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("templates")]
        [HasPermission("Prescriptions.Create")]
        public async Task<IActionResult> SaveTemplate([FromBody] SaveTemplateRequest request)
        {
            var result = await _prescriptionService.SaveTemplateAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("templates")]
        [HasPermission("Prescriptions.View")]
        public async Task<IActionResult> GetTemplates([FromQuery] int? diseaseId, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetTemplatesAsync(diseaseId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("templates/{id}")]
        [HasPermission("Prescriptions.Delete")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            var result = await _prescriptionService.DeleteTemplateAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id}/pdf")]
        [HasPermission("Prescriptions.ExportPdf")]
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
