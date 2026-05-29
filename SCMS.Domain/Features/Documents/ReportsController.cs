using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Shared;
using SCMS.Shared.Contracts.Reports;

namespace SCMS.Domain.Features.Documents
{
    [ApiController]
    [Authorize(Roles = "owner,admin,doctor")]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ReportService _reportService;
        private readonly PdfDocumentService _pdfDocumentService;

        public ReportsController(ReportService reportService, PdfDocumentService pdfDocumentService)
        {
            _reportService = reportService;
            _pdfDocumentService = pdfDocumentService;
        }

        /// <summary>
        /// Get appointment report data (JSON) for a given period.
        /// </summary>
        [HttpGet("appointments")]
        public async Task<IActionResult> GetAppointmentReport(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date)
        {
            var request = new AppointmentReportRequest
            {
                ReportType = reportType ?? "daily",
                Date = date
            };

            var result = await _reportService.GetAppointmentReportAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download appointment report as a PDF file.
        /// </summary>
        [HttpGet("appointments/pdf")]
        public async Task<IActionResult> GetAppointmentReportPdf(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date)
        {
            var request = new AppointmentReportRequest
            {
                ReportType = reportType ?? "daily",
                Date = date
            };

            var result = await _reportService.GetAppointmentReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateAppointmentReportPdf(result.Data);
            var type = (request.ReportType ?? "daily").ToLower();
            var dateStr = (request.Date ?? DateTime.UtcNow).ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"appointment-report-{type}-{dateStr}.pdf");
        }

        /// <summary>
        /// Get revenue report data (JSON) for a given period.
        /// </summary>
        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueReport(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date)
        {
            var request = new RevenueReportRequest
            {
                ReportType = reportType ?? "daily",
                Date = date
            };

            var result = await _reportService.GetRevenueReportAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download revenue report as a PDF file.
        /// </summary>
        [HttpGet("revenue/pdf")]
        public async Task<IActionResult> GetRevenueReportPdf(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date)
        {
            var request = new RevenueReportRequest
            {
                ReportType = reportType ?? "daily",
                Date = date
            };

            var result = await _reportService.GetRevenueReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateRevenueReportPdf(result.Data);
            var type = (request.ReportType ?? "daily").ToLower();
            var dateStr = (request.Date ?? DateTime.UtcNow).ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"revenue-report-{type}-{dateStr}.pdf");
        }

        /// <summary>
        /// Get patient list report data (JSON).
        /// </summary>
        [HttpGet("patients")]
        public async Task<IActionResult> GetPatientListReport()
        {
            var result = await _reportService.GetPatientListReportAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download patient list report as a PDF file.
        /// </summary>
        [HttpGet("patients/pdf")]
        public async Task<IActionResult> GetPatientListReportPdf()
        {
            var result = await _reportService.GetPatientListReportAsync();
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreatePatientListReportPdf(result.Data);
            var dateStr = DateTime.UtcNow.ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"patient-list-report-{dateStr}.pdf");
        }

        /// <summary>
        /// Get medicine stock report data (JSON).
        /// </summary>
        [HttpGet("medicine-stock")]
        public async Task<IActionResult> GetMedicineStockReport()
        {
            var result = await _reportService.GetMedicineStockReportAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download medicine stock report as a PDF file.
        /// </summary>
        [HttpGet("medicine-stock/pdf")]
        public async Task<IActionResult> GetMedicineStockReportPdf()
        {
            var result = await _reportService.GetMedicineStockReportAsync();
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateMedicineStockReportPdf(result.Data);
            var dateStr = DateTime.UtcNow.ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"medicine-stock-report-{dateStr}.pdf");
        }

        /// <summary>
        /// Get follow-up report data (JSON).
        /// </summary>
        [HttpGet("follow-ups")]
        public async Task<IActionResult> GetFollowUpReport(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date,
            [FromQuery] string? status)
        {
            var request = new FollowUpReportRequest
            {
                ReportType = reportType ?? "all",
                Date = date,
                Status = status ?? "all"
            };

            var result = await _reportService.GetFollowUpReportAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download follow-up report as a PDF file.
        /// </summary>
        [HttpGet("follow-ups/pdf")]
        public async Task<IActionResult> GetFollowUpReportPdf(
            [FromQuery] string? reportType,
            [FromQuery] DateTime? date,
            [FromQuery] string? status)
        {
            var request = new FollowUpReportRequest
            {
                ReportType = reportType ?? "all",
                Date = date,
                Status = status ?? "all"
            };

            var result = await _reportService.GetFollowUpReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateFollowUpReportPdf(result.Data);
            var type = (request.ReportType ?? "all").ToLower();
            var dateStr = (request.Date ?? DateTime.UtcNow).ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"follow-up-report-{type}-{dateStr}.pdf");
        }

        /// <summary>
        /// Get monthly business summary report data (JSON).
        /// </summary>
        [HttpGet("business-summary")]
        public async Task<IActionResult> GetBusinessSummaryReport([FromQuery] DateTime? date)
        {
            var request = new BusinessSummaryReportRequest { Date = date };
            var result = await _reportService.GetBusinessSummaryReportAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Download monthly business summary report as a PDF file.
        /// </summary>
        [HttpGet("business-summary/pdf")]
        public async Task<IActionResult> GetBusinessSummaryReportPdf([FromQuery] DateTime? date)
        {
            var request = new BusinessSummaryReportRequest { Date = date };
            var result = await _reportService.GetBusinessSummaryReportAsync(request);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateBusinessSummaryReportPdf(result.Data);
            var dateStr = (request.Date ?? DateTime.UtcNow).ToString("dd-MM-yyyy");
            return File(bytes, "application/pdf", $"business-summary-{dateStr}.pdf");
        }
    }
}
