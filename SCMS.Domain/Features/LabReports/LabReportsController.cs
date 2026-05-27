using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Security;
using SCMS.Shared;
using SCMS.Shared.Contracts.LabReports;

namespace SCMS.Domain.Features.LabReports
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class LabReportsController : ControllerBase
    {
        private readonly LabReportService _labReportService;
        private readonly PdfDocumentService _pdfDocumentService;

        public LabReportsController(LabReportService labReportService, PdfDocumentService pdfDocumentService)
        {
            _labReportService = labReportService;
            _pdfDocumentService = pdfDocumentService;
        }

        [Authorize(Roles = "admin,doctor")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LabReportRequest request)
        {
            var result = await _labReportService.CreateLabReportAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [Authorize(Roles = "admin,doctor")]
        [HttpPost("{id:int}/result")]
        public async Task<IActionResult> AddResult(int id, [FromBody] LabReportResultRequest request)
        {
            var result = await _labReportService.AddResultAsync(id, request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(Result.Failure("User id claim is missing."));

            paginationRequest ??= new PaginationRequest();
            var result = await _labReportService.GetLabReportsAsync(patientId, userId.Value, User.IsStaff(), paginationRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id:int}/pdf")]
        public async Task<IActionResult> GetPdf(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(Result.Failure("User id claim is missing."));

            var result = await _labReportService.GetByIdAsync(id, userId.Value, User.IsStaff());
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateLabReportPdf(result.Data);
            return File(bytes, "application/pdf", $"lab-report-{id}.pdf");
        }
    }
}
