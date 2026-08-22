using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Common;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Documents.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly IPdfDocumentService _pdfDocumentService;

        public ReportsController(IReportService reportService, IPdfDocumentService pdfDocumentService)
        {
            _reportService = reportService;
            _pdfDocumentService = pdfDocumentService;
        }

        /// <summary>Get appointment report data (JSON) for a given period.</summary>
        [HttpGet("appointments")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<AppointmentReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetAppointmentReport([FromQuery] AppointmentReportRequest? request)
        {
            var req = request ?? new AppointmentReportRequest();
            var result = await _reportService.GetAppointmentReportAsync(req);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download appointment report as a PDF file.</summary>
        [HttpGet("appointments/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetAppointmentReportPdf([FromQuery] AppointmentReportRequest? request)
        {
            var req = request ?? new AppointmentReportRequest();
            var result = await _reportService.GetAppointmentReportAsync(req);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateAppointmentReportPdf(result.Data);
            var type = (req.ReportType ?? "daily").ToLower();
            var dateStr = (req.StartDate ?? req.Date ?? DateTime.UtcNow).ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"appointment-report-{type}-{dateStr}.pdf");
        }

        /// <summary>Get revenue report data (JSON) for a given period.</summary>
        [HttpGet("revenue")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<RevenueReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetRevenueReport([FromQuery] RevenueReportRequest? request)
        {
            var req = request ?? new RevenueReportRequest();
            var result = await _reportService.GetRevenueReportAsync(req);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download revenue report as a PDF file.</summary>
        [HttpGet("revenue/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetRevenueReportPdf([FromQuery] RevenueReportRequest? request)
        {
            var req = request ?? new RevenueReportRequest();
            var result = await _reportService.GetRevenueReportAsync(req);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateRevenueReportPdf(result.Data);
            var type = (req.ReportType ?? "daily").ToLower();
            var dateStr = (req.StartDate ?? req.Date ?? DateTime.UtcNow).ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"revenue-report-{type}-{dateStr}.pdf");
        }

        /// <summary>Get patient list report data (JSON).</summary>
        [HttpGet("patients")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<PatientListReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPatientListReport()
        {
            var result = await _reportService.GetPatientListReportAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download patient list report as a PDF file.</summary>
        [HttpGet("patients/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetPatientListReportPdf()
        {
            var result = await _reportService.GetPatientListReportAsync();
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreatePatientListReportPdf(result.Data);
            var dateStr = DateTime.UtcNow.ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"patient-list-report-{dateStr}.pdf");
        }

        /// <summary>Get medicine stock report data (JSON).</summary>
        [HttpGet("medicine-stock")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<MedicineStockReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetMedicineStockReport()
        {
            var result = await _reportService.GetMedicineStockReportAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download medicine stock report as a PDF file.</summary>
        [HttpGet("medicine-stock/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetMedicineStockReportPdf()
        {
            var result = await _reportService.GetMedicineStockReportAsync();
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateMedicineStockReportPdf(result.Data);
            var dateStr = DateTime.UtcNow.ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"medicine-stock-report-{dateStr}.pdf");
        }

        /// <summary>Get follow-up report data (JSON).</summary>
        [HttpGet("follow-ups")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<FollowUpReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetFollowUpReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status)
        {
            var request = new FollowUpReportRequest
            {
                StartDate = startDate,
                EndDate = endDate,
                Status = status ?? "all"
            };

            var result = await _reportService.GetFollowUpReportAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download follow-up report as a PDF file.</summary>
        [HttpGet("follow-ups/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetFollowUpReportPdf(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status)
        {
            var request = new FollowUpReportRequest
            {
                StartDate = startDate,
                EndDate = endDate,
                Status = status ?? "all"
            };

            var result = await _reportService.GetFollowUpReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateFollowUpReportPdf(result.Data);
            var dateStr = startDate?.ToString(FormatHelper.DateFormat) ?? DateTime.UtcNow.ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"follow-up-report-{dateStr}.pdf");
        }

        /// <summary>Get prescription report data (JSON).</summary>
        [HttpGet("prescriptions")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<PrescriptionReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPrescriptionReport()
        {
            var result = await _reportService.GetPrescriptionReportAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download prescription report as a PDF file.</summary>
        [HttpGet("prescriptions/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetPrescriptionReportPdf()
        {
            var result = await _reportService.GetPrescriptionReportAsync();
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreatePrescriptionReportPdf(result.Data);
            var dateStr = DateTime.UtcNow.ToString(FormatHelper.DateFormat);
            return File(bytes, "application/pdf", $"prescription-report-{dateStr}.pdf");
        }

        /// <summary>Get monthly business summary report data (JSON).</summary>
        [HttpGet("business-summary")]
        [HasPermission("Reports.View")]
        [ProducesResponseType(typeof(Result<BusinessSummaryReportResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetBusinessSummaryReport([FromQuery] int? month, [FromQuery] int? year)
        {
            var request = new BusinessSummaryReportRequest { Month = month, Year = year };
            var result = await _reportService.GetBusinessSummaryReportAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Download monthly business summary report as a PDF file.</summary>
        [HttpGet("business-summary/pdf")]
        [HasPermission("Reports.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetBusinessSummaryReportPdf([FromQuery] int? month, [FromQuery] int? year)
        {
            var request = new BusinessSummaryReportRequest { Month = month, Year = year };
            var result = await _reportService.GetBusinessSummaryReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateBusinessSummaryReportPdf(result.Data);
            return File(bytes, "application/pdf", $"business-summary-{year ?? DateTime.UtcNow.Year}-{month ?? DateTime.UtcNow.Month:D2}.pdf");
        }
    }
}
