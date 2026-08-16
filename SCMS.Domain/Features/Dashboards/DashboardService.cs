using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.DTOs;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared.Contracts.Prescriptions;
using SCMS.Shared;

namespace SCMS.Domain.Features.Dashboards
{
    public class DashboardService
    {
        private readonly AppDbContext _context;
        private const int LowStockThreshold = 20;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync()
        {
            var todayUtc = DateTime.UtcNow.Date;
            var tomorrowUtc = todayUtc.AddDays(1);
            var thirtyDaysFromNow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
            var todayDateOnly = DateOnly.FromDateTime(DateTime.UtcNow);

            var todayAppointments = await GetTodayAppointmentsAsync(todayUtc, tomorrowUtc);
            var upcomingList = GetUpcomingPatients(todayAppointments);
            var (lowStockMeds, expiringBatches) = await GetInventoryAlertsAsync(todayDateOnly, thirtyDaysFromNow);
            var dailyRevenue = await GetDailyRevenueAsync(todayUtc, tomorrowUtc);

            var totalRevenueDouble = await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.PaymentStatus == "paid")
                .Select(p => (double)p.Amount)
                .SumAsync();

            var totalRevenue = (decimal)totalRevenueDouble;

            var todayPatientsCount = todayAppointments
                .Select(a => a.PatientId)
                .Distinct()
                .Count();

            var totalMedicinesCount = await _context.TblMedicines
                .AsNoTracking()
                .CountAsync(m => m.DeleteFlag != true);

            var stockRiskStatus = lowStockMeds.Count > 0 ? "At Risk" : "Safe";

            return Result<DoctorDashboardResponse>.Success(new DoctorDashboardResponse
            {
                TodayAppointmentsCount = todayAppointments.Count,
                NextPatients = upcomingList,
                LowStockAlertsCount = lowStockMeds.Count,
                ExpiringBatchesCount = expiringBatches.Count,
                DailyRevenue = dailyRevenue,
                TotalRevenue = totalRevenue,
                TodayPatientsCount = todayPatientsCount,
                TotalMedicinesCount = totalMedicinesCount,
                StockRiskStatus = stockRiskStatus,
                LowStockAlerts = lowStockMeds,
                ExpiringBatchesAlerts = expiringBatches
            });
        }

        public async Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId)
        {
            var patients = await GetPatientProfilesAsync(userId);
            var patientIds = patients.Select(p => p.PatientId).ToList();

            var upcomingResponseList = await GetUpcomingAppointmentsAsync(patientIds);
            var prescriptionResponseList = await GetPrescriptionHistoryAsync(patientIds);
            var outstandingPayments = await GetOutstandingBalancesAsync(patientIds);

            return Result<PatientDashboardResponse>.Success(new PatientDashboardResponse
            {
                PatientProfiles = patients.Select(MapPatientToResponse).ToList(),
                UpcomingAppointments = upcomingResponseList,
                PrescriptionHistory = prescriptionResponseList,
                OutstandingBalances = outstandingPayments
            });
        }

        // --- Private Helper Methods for Doctor Dashboard ---

        private async Task<List<TblAppointment>> GetTodayAppointmentsAsync(DateTime start, DateTime end)
        {
            return await _context.TblAppointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= start && a.Datetime < end)
                .OrderBy(a => a.Id)
                .ToListAsync();
        }

        private List<UpcomingPatientDto> GetUpcomingPatients(List<TblAppointment> todayAppointments)
        {
            return todayAppointments
                .Where(a => a.Status == "confirmed" || a.Status == "pending")
                .Take(3)
                .Select(a => new UpcomingPatientDto
                {
                    Id = a.Id,
                    AppointmentCode = a.AppointmentCode,
                    PatientName = a.Patient?.Name ?? "Unknown",
                    Datetime = a.Datetime.ToString("t"),
                    TokenNumber = todayAppointments.IndexOf(a) + 1,
                    Notes = a.Notes
                })
                .ToList();
        }

        private async Task<(List<string> LowStock, List<string> Expiring)> GetInventoryAlertsAsync(DateOnly today, DateOnly thirtyDaysFromNow)
        {
            var activeBatches = await _context.TblMedicineBatches
                .AsNoTracking()
                .Include(b => b.Med)
                .Where(b => b.Status == "active" && b.ExpiryDate > today && b.DeleteFlag != true)
                .ToListAsync();

            var lowStockMeds = activeBatches
                .GroupBy(b => b.MedId)
                .Where(g => g.Sum(b => b.Quantity) < LowStockThreshold)
                .Select(g => $"{g.First().Med?.Name ?? "Unknown"} (Stock: {g.Sum(b => b.Quantity)})")
                .ToList();

            var expiringBatches = activeBatches
                .Where(b => b.ExpiryDate <= thirtyDaysFromNow && b.ExpiryDate > today)
                .Select(b => $"{b.Med?.Name ?? "Unknown"} Batch {b.BatchNo} (Expires: {b.ExpiryDate.ToString(Common.FormatHelper.DateFormat)})")
                .ToList();

            return (lowStockMeds, expiringBatches);
        }

        private async Task<decimal> GetDailyRevenueAsync(DateTime start, DateTime end)
        {
            var amounts = await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.PaymentStatus == "paid" && p.PaidAt.HasValue && p.PaidAt.Value >= start && p.PaidAt.Value < end)
                .Select(p => p.Amount)
                .ToListAsync();
            return amounts.Sum();
        }

        // --- Private Helper Methods for Patient Dashboard ---

        private async Task<List<TblPatient>> GetPatientProfilesAsync(int userId)
        {
            return await _context.TblPatients
                .AsNoTracking()
                .Where(p => p.UserId == userId && p.DeleteFlag != true)
                .ToListAsync();
        }

        private async Task<List<AppointmentDetailsResponse>> GetUpcomingAppointmentsAsync(List<int> patientIds)
        {
            if (patientIds == null || patientIds.Count == 0)
            {
                return new List<AppointmentDetailsResponse>();
            }

            var upcomingAppts = await _context.TblAppointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => patientIds.Contains(a.PatientId) && a.Datetime >= DateTime.UtcNow && (a.Status == "pending" || a.Status == "confirmed"))
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            if (upcomingAppts.Count == 0)
            {
                return new List<AppointmentDetailsResponse>();
            }

            var dates = upcomingAppts.Select(a => a.Datetime.Date).Distinct().ToList();
            var minDate = dates.Min();
            var maxDate = dates.Max().AddDays(1);

            var dailyActiveAppts = await _context.TblAppointments
                .AsNoTracking()
                .Where(x => x.Datetime >= minDate && x.Datetime < maxDate && x.Status != "cancelled")
                .OrderBy(x => x.Datetime.Date)
                .ThenBy(x => x.Id)
                .Select(x => new { x.Id, Date = x.Datetime.Date })
                .ToListAsync();

            var tokenMap = new Dictionary<int, int>();
            foreach (var group in dailyActiveAppts.GroupBy(x => x.Date))
            {
                int seq = 1;
                foreach (var item in group)
                {
                    tokenMap[item.Id] = seq++;
                }
            }

            return upcomingAppts.Select(a => new AppointmentDetailsResponse
            {
                Id = a.Id,
                AppointmentCode = a.AppointmentCode,
                PatientId = a.PatientId,
                PatientName = a.Patient?.Name ?? "Unknown",
                Datetime = a.Datetime,
                Status = a.Status,
                Notes = a.Notes,
                TokenNumber = tokenMap.TryGetValue(a.Id, out var tok) ? tok : 0,
                ClinicDoctorName = "Clinic Doctor",
                CreatedAt = a.CreatedAt ?? DateTime.UtcNow
            }).ToList();
        }

        private async Task<List<PrescriptionResponse>> GetPrescriptionHistoryAsync(List<int> patientIds)
        {
            if (patientIds == null || patientIds.Count == 0)
            {
                return new List<PrescriptionResponse>();
            }

            var prescriptions = await _context.TblPrescriptions
                .AsNoTracking()
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

            return prescriptions.Select(MapPrescriptionToResponse).ToList();
        }

        private async Task<List<UnpaidInvoiceDto>> GetOutstandingBalancesAsync(List<int> patientIds)
        {
            if (patientIds == null || patientIds.Count == 0)
            {
                return new List<UnpaidInvoiceDto>();
            }

            return await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.Appointment != null && patientIds.Contains(p.Appointment.PatientId) && p.PaymentStatus != "paid")
                .Select(p => new UnpaidInvoiceDto
                {
                    Id = p.Id,
                    AppointmentId = p.AppointmentId,
                    AppointmentCode = p.Appointment != null ? p.Appointment.AppointmentCode : "Unknown",
                    Amount = p.Amount,
                    Tax = p.Tax,
                    Charges = p.Charges,
                    PaymentStatus = p.PaymentStatus,
                    PaymentMethod = p.PaymentMethod
                })
                .ToListAsync();
        }

        // --- Mappers ---

        private PatientProfileResponse MapPatientToResponse(TblPatient p)
        {
            var addressText = p.Address;
            if (!string.IsNullOrEmpty(addressText) && addressText.TrimStart().StartsWith("{"))
            {
                try
                {
                    using var doc = JsonDocument.Parse(addressText);
                    if (doc.RootElement.TryGetProperty("ActualAddress", out var actualProp))
                    {
                        addressText = actualProp.GetString();
                    }
                }
                catch { }
            }

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
                ActualAddress = addressText,
                Allergies = p.Allergies,
                ChronicConditions = p.ChronicConditions,
                PastSurgeries = p.PastSurgeries,
                FamilyHistory = p.FamilyHistory,
                VaccinationHistory = p.VaccinationHistory,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        private PrescriptionResponse MapPrescriptionToResponse(TblPrescription p)
        {
            var itemsList = p.TblPrescriptionItems.Select(item => new PrescriptionItemResponseDto
            {
                Id = item.Id,
                MedicineName = item.Medicine?.Name ?? "Unknown",
                Dosage = item.Dosage,
                Days = item.Days,
                Quantity = item.Quantity,
                Instruction = item.Instruction
            }).ToList();

            return new PrescriptionResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment?.AppointmentCode ?? "Unknown",
                PatientId = p.PatientId,
                PatientName = p.Patient?.Name ?? "Unknown",
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = p.Notes,
                TemperatureC = p.TemperatureC,
                PulseBpm = p.PulseBpm,
                Spo2Percent = p.Spo2Percent,
                HeightCm = p.HeightCm,
                Bmi = p.Bmi,
                LabTestRequests = p.LabTestRequests,
                Items = itemsList,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }
    }
}
