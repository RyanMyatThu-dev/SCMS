using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared;

namespace SCMS.Domain.Features.Appointments
{
    public class AppointmentsService
    {
        private readonly ScmsDbContext _context;
        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "pending",
            "confirmed",
            "cancelled",
            "completed"
        };

        public AppointmentsService(ScmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<BookAppointmentResponse>> BookAppointmentAsync(BookAppointmentRequest request, int userId)
        {
            if (request.PatientId <= 0)
            {
                return Result<BookAppointmentResponse>.Failure("Patient id is required.");
            }
            //if (request.Datetime == default)
            //{
            //    return Result<BookAppointmentResponse>.Failure("Appointment date and time is required.");
            //}
            if (request.Datetime <= DateTime.UtcNow)
            {
                return Result<BookAppointmentResponse>.Failure("Appointment date and time must be in the future.");
            }

            // Verify patient exists and belongs to the user (or is accessible)
            var patient = await _context.TblPatients
                .FirstOrDefaultAsync(p => p.PatientId == request.PatientId && p.UserId == userId && p.DeleteFlag != true);

            if (patient == null)
            {
                return Result<BookAppointmentResponse>.Failure("Patient not found.");
            }

            // Generate a daily-sequential appointment code (APT-001, resets each day)
            var appointmentDate = request.Datetime.Date;
            var nextDay = appointmentDate.AddDays(1);

            var todayCodes = await _context.TblAppointments
                .Where(a => a.Datetime >= appointmentDate && a.Datetime < nextDay)
                .Select(a => a.AppointmentCode)
                .ToListAsync();

            var maxSeq = todayCodes
                .Where(c => c != null && c.StartsWith("APT-"))
                .Select(c =>
                {
                    var numPart = c.Substring(4); // after "APT-"
                    return int.TryParse(numPart, out var n) ? n : 0;
                })
                .DefaultIfEmpty(0)
                .Max();

            var code = $"APT-{(maxSeq + 1):D3}";

            // Save the appointment
            var appointment = new TblAppointment
            {
                AppointmentCode = code,
                PatientId = request.PatientId,
                Datetime = request.Datetime,
                Status = "pending", // Default to pending
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TblAppointments.Add(appointment);
            await _context.SaveChangesAsync();

            // Calculate Token and Queue status
            var queueStatus = await GetQueueInfoAsync(appointment);

            // Add an in-app notification for the patient user
            var notification = new TblNotification
            {
                UserId = patient.UserId,
                Title = "Appointment Booked",
                Description = $"Your appointment (Code: {code}) has been booked for {request.Datetime:f} and is pending approval. You are {queueStatus.PatientsAhead + 1} in queue.",
                ActionRoute = $"/appointments/{appointment.Id}",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _context.TblNotifications.Add(notification);
            await _context.SaveChangesAsync();

            return Result<BookAppointmentResponse>.Success(new BookAppointmentResponse
            {
                AppointmentId = appointment.Id,
                AppointmentCode = appointment.AppointmentCode,
                TokenNumber = queueStatus.PatientTokenNumber,
                EstimatedWaitTimeMinutes = queueStatus.EstimatedWaitTimeMinutes,
                Status = appointment.Status
            }, "Appointment booked successfully.");
        }

        public async Task<Result<AppointmentDetailsResponse>> UpdateAppointmentStatusAsync(int id, UpdateAppointmentStatusRequest request)
        {
            var normalizedStatus = request.Status?.ToLower().Trim();
            if (string.IsNullOrWhiteSpace(normalizedStatus) || !AllowedStatuses.Contains(normalizedStatus))
            {
                return Result<AppointmentDetailsResponse>.Failure("Invalid appointment status. Allowed values are pending, confirmed, cancelled, completed.");
            }

            var appointment = await _context.TblAppointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return Result<AppointmentDetailsResponse>.Failure("Appointment not found.");
            }

            var oldStatus = appointment.Status;
            appointment.Status = normalizedStatus;
            appointment.Notes = request.Notes ?? appointment.Notes;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create notification if status changed
            if (oldStatus != appointment.Status)
            {
                var notification = new TblNotification
                {
                    UserId = appointment.Patient.UserId,
                    Title = $"Appointment {char.ToUpper(appointment.Status[0]) + appointment.Status.Substring(1)}",
                    Description = $"Your appointment (Code: {appointment.AppointmentCode}) status has been updated to {appointment.Status}.",
                    ActionRoute = $"/appointments/{appointment.Id}",
                    CreatedAt = DateTime.UtcNow,
                    DeleteFlag = false
                };
                _context.TblNotifications.Add(notification);
                await _context.SaveChangesAsync();
            }

            return Result<AppointmentDetailsResponse>.Success(MapToDetailsResponse(appointment, await GetTokenNumberAsync(appointment)), "Appointment status updated.");
        }

        public async Task<Result<AppointmentDetailsResponse>> RescheduleAppointmentAsync(int id, RescheduleAppointmentRequest request)
        {
            if (request.NewDatetime == default)
            {
                return Result<AppointmentDetailsResponse>.Failure("New appointment date and time is required.");
            }
            if (request.NewDatetime <= DateTime.UtcNow)
            {
                return Result<AppointmentDetailsResponse>.Failure("New appointment date and time must be in the future.");
            }

            var appointment = await _context.TblAppointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return Result<AppointmentDetailsResponse>.Failure("Appointment not found.");
            }

            appointment.Datetime = request.NewDatetime;
            appointment.Status = "pending"; // Rescheduling shifts it back to pending
            appointment.Notes = request.Notes ?? appointment.Notes;
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create notification
            var notification = new TblNotification
            {
                UserId = appointment.Patient.UserId,
                Title = "Appointment Reschedule Requested",
                Description = $"Reschedule requested for appointment {appointment.AppointmentCode} to {request.NewDatetime:f}.",
                ActionRoute = $"/appointments/{appointment.Id}",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _context.TblNotifications.Add(notification);
            await _context.SaveChangesAsync();

            return Result<AppointmentDetailsResponse>.Success(MapToDetailsResponse(appointment, await GetTokenNumberAsync(appointment)), "Appointment rescheduled.");
        }

        public async Task<PagedResult<AppointmentDetailsResponse>> GetAppointmentsAsync(
            DateTime? startDate,
            DateTime? endDate,
            string? status,
            int? patientId,
            PaginationRequest paginationRequest,
            int? currentUserId = null,
            bool isStaff = true)
        {
            var query = _context.TblAppointments
                .Include(a => a.Patient)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Datetime >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                query = query.Where(a => a.Datetime <= endDate.Value);
            }
            if (!string.IsNullOrEmpty(status))
            {
                var s = status.ToLower().Trim();
                if (!AllowedStatuses.Contains(s))
                {
                    return PagedResult<AppointmentDetailsResponse>.Failure("Invalid appointment status filter.");
                }
                query = query.Where(a => a.Status == s);
            }
            if (patientId.HasValue)
            {
                query = query.Where(a => a.PatientId == patientId.Value);
            }
            if (!isStaff && currentUserId.HasValue)
            {
                query = query.Where(a => a.Patient.UserId == currentUserId.Value);
            }

            var totalCount = await query.CountAsync();
            var appointments = await query
                .OrderBy(a => a.Datetime)
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .ToListAsync();

            var list = new List<AppointmentDetailsResponse>();
            foreach (var a in appointments)
            {
                var token = await GetTokenNumberAsync(a);
                list.Add(MapToDetailsResponse(a, token));
            }

            var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
            return PagedResult<AppointmentDetailsResponse>.Success(list, pagination);
        }

        public async Task<Result<AppointmentQueueStatusResponse>> GetPatientQueueStatusAsync(int id)
        {
            var appointment = await _context.TblAppointments
                .FirstOrDefaultAsync(a => a.Id == id);

            if (appointment == null)
            {
                return Result<AppointmentQueueStatusResponse>.Failure("Appointment not found.");
            }

            var queueInfo = await GetQueueInfoAsync(appointment);
            return Result<AppointmentQueueStatusResponse>.Success(queueInfo, "Queue status fetched.");
        }

        public async Task<Result<AppointmentDetailsResponse>> CallNextPatientAsync()
        {
            // Call next confirmed patient for today
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var nextAppointment = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status == "confirmed")
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync();

            if (nextAppointment == null)
            {
                // Try to see if there is any pending one we can auto-call
                nextAppointment = await _context.TblAppointments
                    .Include(a => a.Patient)
                    .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status == "pending")
                    .OrderBy(a => a.Id)
                    .FirstOrDefaultAsync();

                if (nextAppointment == null)
                {
                    return Result<AppointmentDetailsResponse>.Failure("No more patients in queue for today.");
                }
            }

            // Mark previous active/confirmed appointments as Completed (or let doctor do it, but here we can set it to confirmed/in-progress)
            // For now, let's update this patient to 'confirmed' (or 'completed' if we want to call the next)
            // But to trigger "Call Next", let's mark any current 'confirmed' that was ahead of this as 'completed'
            var aheadAppointments = await _context.TblAppointments
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Id < nextAppointment.Id && a.Status == "confirmed")
                .ToListAsync();

            foreach (var aa in aheadAppointments)
            {
                aa.Status = "completed";
                aa.UpdatedAt = DateTime.UtcNow;
            }

            // Make sure the next appointment status is 'confirmed' so it shows as active in consultation
            nextAppointment.Status = "confirmed";
            nextAppointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create notification for the called patient
            var notification = new TblNotification
            {
                UserId = nextAppointment.Patient.UserId,
                Title = "It's Your Turn!",
                Description = $"Doctor is ready to see you! Please proceed to the consultation room. (Token #{await GetTokenNumberAsync(nextAppointment)})",
                ActionRoute = $"/appointments/{nextAppointment.Id}",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _context.TblNotifications.Add(notification);
            await _context.SaveChangesAsync();

            var token = await GetTokenNumberAsync(nextAppointment);
            return Result<AppointmentDetailsResponse>.Success(MapToDetailsResponse(nextAppointment, token), "Next patient called. Audio chime triggered.");
        }

        // Helper calculations
        private async Task<int> GetTokenNumberAsync(TblAppointment appointment)
        {
            var today = appointment.Datetime.Date;
            var tomorrow = today.AddDays(1);
            var list = await _context.TblAppointments
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled")
                .OrderBy(a => a.Id)
                .Select(a => a.Id)
                .ToListAsync();

            return list.IndexOf(appointment.Id) + 1;
        }

        private async Task<AppointmentQueueStatusResponse> GetQueueInfoAsync(TblAppointment appointment)
        {
            var today = appointment.Datetime.Date;
            var tomorrow = today.AddDays(1);
            var todayAppointments = await _context.TblAppointments
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled")
                .OrderBy(a => a.Id)
                .ToListAsync();

            var token = todayAppointments.FindIndex(a => a.Id == appointment.Id) + 1;

            // Find current active token
            // Active token is the first 'confirmed' appointment today.
            // If none, it's the last 'completed' appointment today.
            // If none, it's 0.
            int activeToken = 0;
            var activeAppt = todayAppointments.FirstOrDefault(a => a.Status == "confirmed");
            if (activeAppt != null)
            {
                activeToken = todayAppointments.FindIndex(a => a.Id == activeAppt.Id) + 1;
            }
            else
            {
                var lastCompleted = todayAppointments.LastOrDefault(a => a.Status == "completed");
                if (lastCompleted != null)
                {
                    activeToken = todayAppointments.FindIndex(a => a.Id == lastCompleted.Id) + 1;
                }
            }

            // Patients ahead: count of pending or confirmed before this one
            var ahead = todayAppointments
                .Where(a => a.Id < appointment.Id && (a.Status == "confirmed" || a.Status == "pending"))
                .Count();

            var completedCount = todayAppointments.Count(a => a.Status == "completed");
            var totalCount = todayAppointments.Count;
            double progress = totalCount > 0 ? (double)completedCount / totalCount * 100.0 : 0.0;

            string doctorStatus = "Available";
            if (activeAppt != null)
            {
                doctorStatus = "In Consultation";
            }
            else if (todayAppointments.Any(a => a.Status == "pending"))
            {
                doctorStatus = "Available";
            }

            var isYourTurn = appointment.Status == "confirmed" && activeAppt?.Id == appointment.Id;

            string message = ahead == 0
                ? (isYourTurn ? "It is your turn!" : "You are next in queue.")
                : $"You are number {ahead + 1} in queue. (There are {ahead} patient(s) ahead of you)";

            return new AppointmentQueueStatusResponse
            {
                PatientTokenNumber = token,
                CurrentActiveTokenNumber = activeToken,
                PatientsAhead = ahead,
                QueueMessage = message,
                EstimatedWaitTimeMinutes = ahead * 10, // 10 minutes per patient ahead (User requested)
                DoctorStatus = doctorStatus,
                ProgressBarPercentage = Math.Round(progress, 2),
                IsYourTurn = isYourTurn
            };
        }

        private AppointmentDetailsResponse MapToDetailsResponse(TblAppointment a, int token)
        {
            return new AppointmentDetailsResponse
            {
                Id = a.Id,
                AppointmentCode = a.AppointmentCode,
                PatientId = a.PatientId,
                PatientName = a.Patient?.Name ?? "Unknown",
                Datetime = a.Datetime,
                Status = a.Status,
                Notes = a.Notes,
                TokenNumber = token,
                ClinicDoctorName = "Clinic Doctor",
                CreatedAt = a.CreatedAt ?? DateTime.UtcNow
            };
        }
    }
}
