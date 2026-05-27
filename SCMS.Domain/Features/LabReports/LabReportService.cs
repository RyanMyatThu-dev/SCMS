using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Shared;
using SCMS.Shared.Contracts.LabReports;

namespace SCMS.Domain.Features.LabReports
{
    public class LabReportService
    {
        private readonly ScmsDbContext _context;

        public LabReportService(ScmsDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<LabReportResponse>> GetLabReportsAsync(int? patientId, int currentUserId, bool isStaff, PaginationRequest paginationRequest)
        {
            var query = _context.TblLabReports
                .Include(l => l.Patient)
                .Where(l => l.DeleteFlag != true);

            if (patientId.HasValue)
            {
                query = query.Where(l => l.PatientId == patientId.Value);
            }

            if (!isStaff)
            {
                query = query.Where(l => l.Patient.UserId == currentUserId);
            }

            var totalCount = await query.CountAsync();
            var list = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .Select(l => MapToResponse(l))
                .ToListAsync();

            return PagedResult<LabReportResponse>.Success(list, new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount));
        }

        public async Task<Result<LabReportResponse>> CreateLabReportAsync(LabReportRequest request)
        {
            if (request.PatientId <= 0)
            {
                return Result<LabReportResponse>.Failure("Patient id is required.");
            }
            if (string.IsNullOrWhiteSpace(request.TestName))
            {
                return Result<LabReportResponse>.Failure("Test name is required.");
            }

            var patient = await _context.TblPatients.FirstOrDefaultAsync(p => p.PatientId == request.PatientId && p.DeleteFlag != true);
            if (patient == null)
            {
                return Result<LabReportResponse>.Failure("Patient not found.");
            }

            if (request.AppointmentId.HasValue && !await _context.TblAppointments.AnyAsync(a => a.Id == request.AppointmentId.Value && a.PatientId == request.PatientId))
            {
                return Result<LabReportResponse>.Failure("Appointment not found for patient.");
            }

            if (request.PrescriptionId.HasValue && !await _context.TblPrescriptions.AnyAsync(p => p.Id == request.PrescriptionId.Value && p.PatientId == request.PatientId && p.DeleteFlag != true))
            {
                return Result<LabReportResponse>.Failure("Prescription not found for patient.");
            }

            var report = new TblLabReport
            {
                PatientId = request.PatientId,
                AppointmentId = request.AppointmentId,
                PrescriptionId = request.PrescriptionId,
                TestName = request.TestName.Trim(),
                Status = "requested",
                Notes = request.Notes,
                DueAt = request.DueAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblLabReports.Add(report);
            _context.TblNotifications.Add(new TblNotification
            {
                UserId = patient.UserId,
                Title = "Lab Test Requested",
                Description = $"{report.TestName} has been requested for {patient.Name}.",
                ActionRoute = $"/records/{patient.PatientId}",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            });

            await _context.SaveChangesAsync();
            report.Patient = patient;

            return Result<LabReportResponse>.Success(MapToResponse(report), "Lab report requested.");
        }

        public async Task<Result<LabReportResponse>> AddResultAsync(int id, LabReportResultRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ResultSummary))
            {
                return Result<LabReportResponse>.Failure("Result summary is required.");
            }

            var report = await _context.TblLabReports
                .Include(l => l.Patient)
                .FirstOrDefaultAsync(l => l.Id == id && l.DeleteFlag != true);

            if (report == null)
            {
                return Result<LabReportResponse>.Failure("Lab report not found.");
            }

            report.Status = "completed";
            report.ResultSummary = request.ResultSummary.Trim();
            report.AttachmentUrl = request.AttachmentUrl;
            report.CompletedAt = DateTime.UtcNow;
            report.UpdatedAt = DateTime.UtcNow;

            _context.TblNotifications.Add(new TblNotification
            {
                UserId = report.Patient.UserId,
                Title = "Lab Report Ready",
                Description = $"{report.TestName} result is ready to view.",
                ActionRoute = $"/records/{report.PatientId}",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            });

            await _context.SaveChangesAsync();

            return Result<LabReportResponse>.Success(MapToResponse(report), "Lab result saved.");
        }

        public async Task<Result<LabReportResponse>> GetByIdAsync(int id, int currentUserId, bool isStaff)
        {
            var report = await _context.TblLabReports
                .Include(l => l.Patient)
                .FirstOrDefaultAsync(l => l.Id == id && l.DeleteFlag != true);

            if (report == null || (!isStaff && report.Patient.UserId != currentUserId))
            {
                return Result<LabReportResponse>.Failure("Lab report not found.");
            }

            return Result<LabReportResponse>.Success(MapToResponse(report));
        }

        private static LabReportResponse MapToResponse(TblLabReport report)
            => new()
            {
                Id = report.Id,
                PatientId = report.PatientId,
                PatientName = report.Patient?.Name ?? "Unknown",
                AppointmentId = report.AppointmentId,
                PrescriptionId = report.PrescriptionId,
                TestName = report.TestName,
                Status = report.Status,
                Notes = report.Notes,
                ResultSummary = report.ResultSummary,
                AttachmentUrl = report.AttachmentUrl,
                DueAt = report.DueAt,
                CompletedAt = report.CompletedAt,
                CreatedAt = report.CreatedAt ?? DateTime.UtcNow
            };
    }
}
