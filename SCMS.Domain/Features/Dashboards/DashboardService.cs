using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Features.Dashboards.Models;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Domain.Features.Prescriptions.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Dashboards
{
    public class DashboardService
    {
        private readonly ScmsDbContext _context;
        private const int LowStockThreshold = 20;

        public DashboardService(ScmsDbContext context)
        {
            _context = context;
        }

        // Helper structure for patient address serialization
        public class PatientAddressMetadata
        {
            public string? ActualAddress { get; set; }
            public string? Allergies { get; set; }
            public string? ChronicConditions { get; set; }
            public string? PastSurgeries { get; set; }
            public string? FamilyHistory { get; set; }
            public string? VaccinationHistory { get; set; }
        }

        // Helper structure for vitals serialization
        public class PrescriptionNotesMetadata
        {
            public string? ActualNotes { get; set; }
            public double? TemperatureC { get; set; }
            public int? PulseBpm { get; set; }
            public int? Spo2Percent { get; set; }
            public double? HeightCm { get; set; }
            public double? Bmi { get; set; }
            public string? LabTestRequests { get; set; }
        }

        public async Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync()
        {
            var todayUtc = DateTime.UtcNow.Date;
            var today = DateTime.Today; // local today for appointments
            var thirtyDaysFromNow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
            var todayDateOnly = DateOnly.FromDateTime(DateTime.UtcNow);

            // 1. Total appointments today
            var todayAppointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime.Date == todayUtc || a.Datetime.Date == today)
                .OrderBy(a => a.Id)
                .ToListAsync();

            var todayCount = todayAppointments.Count;

            // 2. Next 3 upcoming patients
            var upcomingList = todayAppointments
                .Where(a => a.Status == "confirmed" || a.Status == "pending")
                .Take(3)
                .Select((a, idx) => new UpcomingPatientDto
                {
                    AppointmentId = a.Id,
                    AppointmentCode = a.AppointmentCode,
                    PatientName = a.Patient?.Name ?? "Unknown",
                    Time = a.Datetime.ToString("t"),
                    TokenNumber = todayAppointments.IndexOf(a) + 1,
                    ReasonForVisit = a.Notes
                })
                .ToList();

            // 3. Low stock and expiring alerts
            var activeBatches = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .Where(b => b.Status == "active" && b.DeleteFlag != true)
                .ToListAsync();

            var lowStockMeds = activeBatches
                .GroupBy(b => b.MedId)
                .Where(g => g.Sum(b => b.Quantity) < LowStockThreshold)
                .Select(g => $"{g.First().Med?.Name ?? "Unknown"} (Stock: {g.Sum(b => b.Quantity)})")
                .ToList();

            var expiringBatches = activeBatches
                .Where(b => b.ExpiryDate <= thirtyDaysFromNow && b.ExpiryDate > todayDateOnly)
                .Select(b => $"{b.Med?.Name ?? "Unknown"} Batch {b.BatchNo} (Expires: {b.ExpiryDate:yyyy-MM-dd})")
                .ToList();

            // 4. Daily revenue overview (Consultation fees collected today)
            var dailyRevenue = await _context.TblPayments
                .Where(p => p.PaymentStatus == "paid" && p.PaidAt.HasValue && p.PaidAt.Value.Date == todayUtc)
                .SumAsync(p => p.Amount);

            return Result<DoctorDashboardResponse>.Success(new DoctorDashboardResponse
            {
                TodayAppointmentsCount = todayCount,
                NextPatients = upcomingList,
                LowStockAlertsCount = lowStockMeds.Count,
                ExpiringBatchesCount = expiringBatches.Count,
                DailyRevenue = dailyRevenue,
                LowStockAlerts = lowStockMeds,
                ExpiringBatchesAlerts = expiringBatches
            });
        }

        public async Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId)
        {
            // 1. Fetch Patient Profiles for this User
            var patients = await _context.TblPatients
                .Where(p => p.UserId == userId && p.DeleteFlag != true)
                .ToListAsync();

            var patientProfiles = patients.Select(MapPatientToResponse).ToList();
            var patientIds = patients.Select(p => p.PatientId).ToList();

            // 2. Fetch Upcoming Appointments
            var upcomingAppts = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => patientIds.Contains(a.PatientId) && a.Datetime >= DateTime.UtcNow && (a.Status == "pending" || a.Status == "confirmed"))
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            // We need to retrieve all today's appointments to determine the token numbers for each upcoming appointment
            var upcomingResponseList = new List<AppointmentDetailsResponse>();
            foreach (var a in upcomingAppts)
            {
                var today = a.Datetime.Date;
                var todayList = await _context.TblAppointments
                    .Where(x => x.Datetime.Date == today)
                    .OrderBy(x => x.Id)
                    .Select(x => x.Id)
                    .ToListAsync();
                var token = todayList.IndexOf(a.Id) + 1;

                upcomingResponseList.Add(new AppointmentDetailsResponse
                {
                    Id = a.Id,
                    AppointmentCode = a.AppointmentCode,
                    PatientId = a.PatientId,
                    PatientName = a.Patient?.Name ?? "Unknown",
                    Datetime = a.Datetime,
                    Status = a.Status,
                    Notes = a.Notes,
                    TokenNumber = token,
                    CreatedAt = a.CreatedAt ?? DateTime.UtcNow
                });
            }

            // 3. Fetch Prescription History
            var prescriptions = await _context.TblPrescriptions
                .Include(p => p.Patient)
                .Include(p => p.Appointment)
                .Include(p => p.Disease)
                .Include(p => p.TblPrescriptionItems)
                    .ThenInclude(i => i.Medicine)
                .Include(p => p.TblPrescriptionItems)
                    .ThenInclude(i => i.MedicineBatch)
                .Where(p => patientIds.Contains(p.PatientId) && p.DeleteFlag != true)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var prescriptionResponseList = prescriptions.Select(MapPrescriptionToResponse).ToList();

            // 4. Fetch Outstanding Balances
            var appointmentIds = await _context.TblAppointments
                .Where(a => patientIds.Contains(a.PatientId))
                .Select(a => a.Id)
                .ToListAsync();

            var outstandingPayments = await _context.TblPayments
                .Where(p => appointmentIds.Contains(p.AppointmentId) && p.PaymentStatus != "paid")
                .Select(p => new UnpaidInvoiceDto
                {
                    PaymentId = p.Id,
                    AppointmentId = p.AppointmentId,
                    AppointmentCode = p.Appointment != null ? p.Appointment.AppointmentCode : "Unknown",
                    Amount = p.Amount,
                    Tax = p.Tax,
                    Charges = p.Charges,
                    PaymentStatus = p.PaymentStatus,
                    PaymentMethod = p.PaymentMethod
                })
                .ToListAsync();

            return Result<PatientDashboardResponse>.Success(new PatientDashboardResponse
            {
                PatientProfiles = patientProfiles,
                UpcomingAppointments = upcomingResponseList,
                PrescriptionHistory = prescriptionResponseList,
                OutstandingBalances = outstandingPayments
            });
        }

        private PatientProfileResponse MapPatientToResponse(TblPatient p)
        {
            var addressMeta = ParsePatientAddress(p.Address);
            return new PatientProfileResponse
            {
                PatientId = p.PatientId,
                UserId = p.UserId,
                Name = p.Name,
                MobileNo = p.MobileNo,
                Email = p.Email,
                DateOfBirth = p.DateOfBirth,
                Gender = p.Gender,
                BloodType = p.BloodType,
                ActualAddress = addressMeta.ActualAddress,
                Allergies = addressMeta.Allergies,
                ChronicConditions = addressMeta.ChronicConditions,
                PastSurgeries = addressMeta.PastSurgeries,
                FamilyHistory = addressMeta.FamilyHistory,
                VaccinationHistory = addressMeta.VaccinationHistory,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        private PrescriptionResponse MapPrescriptionToResponse(TblPrescription p)
        {
            var notesMeta = ParsePrescriptionNotes(p.Notes);

            var itemsList = p.TblPrescriptionItems.Select(item => new PrescriptionItemResponseDto
            {
                Id = item.Id,
                MedicineId = item.MedicineId,
                MedicineName = item.Medicine.Name,
                MedicineBatchId = item.MedicineBatchId,
                BatchNo = item.MedicineBatch?.BatchNo,
                Dosage = item.Dosage,
                Days = item.Days,
                Quantity = item.Quantity,
                Instruction = item.Instruction
            }).ToList();

            return new PrescriptionResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment != null ? p.Appointment.AppointmentCode : "Unknown",
                PatientId = p.PatientId,
                PatientName = p.Patient != null ? p.Patient.Name : "Unknown",
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = notesMeta.ActualNotes,
                TemperatureC = notesMeta.TemperatureC,
                PulseBpm = notesMeta.PulseBpm,
                Spo2Percent = notesMeta.Spo2Percent,
                HeightCm = notesMeta.HeightCm,
                Bmi = notesMeta.Bmi,
                LabTestRequests = notesMeta.LabTestRequests,
                Items = itemsList,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        private PatientAddressMetadata ParsePatientAddress(string? address)
        {
            if (string.IsNullOrEmpty(address)) return new PatientAddressMetadata();
            try
            {
                if (address.TrimStart().StartsWith("{"))
                {
                    return JsonSerializer.Deserialize<PatientAddressMetadata>(address) ?? new PatientAddressMetadata();
                }
            }
            catch { }
            return new PatientAddressMetadata { ActualAddress = address };
        }

        private PrescriptionNotesMetadata ParsePrescriptionNotes(string? notes)
        {
            if (string.IsNullOrEmpty(notes)) return new PrescriptionNotesMetadata();
            try
            {
                if (notes.TrimStart().StartsWith("{"))
                {
                    return JsonSerializer.Deserialize<PrescriptionNotesMetadata>(notes) ?? new PrescriptionNotesMetadata();
                }
            }
            catch { }
            return new PrescriptionNotesMetadata { ActualNotes = notes };
        }
    }
}
