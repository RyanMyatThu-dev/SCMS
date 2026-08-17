using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.DTOs;
using SCMS.Shared;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared.Contracts.Prescriptions;

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

        public async Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync(string period = "daily", CancellationToken cancellationToken = default)
        {
            var normPeriod = (period ?? "daily").ToLower().Trim();
            var nowUtc = DateTime.UtcNow;
            var todayUtc = nowUtc.Date;
            var tomorrowUtc = todayUtc.AddDays(1);
            var thirtyDaysFromNow = DateOnly.FromDateTime(nowUtc.AddDays(30));
            var todayDateOnly = DateOnly.FromDateTime(nowUtc);

            // Determine Sargable half-open date range [periodStart, periodEnd)
            DateTime periodStart;
            DateTime periodEnd;

            switch (normPeriod)
            {
                case "weekly":
                    int diff = ((int)todayUtc.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
                    periodStart = todayUtc.AddDays(-diff);
                    periodEnd = periodStart.AddDays(7);
                    break;
                case "monthly":
                    periodStart = new DateTime(todayUtc.Year, todayUtc.Month, 1);
                    periodEnd = periodStart.AddMonths(1);
                    break;
                case "all":
                    periodStart = DateTime.MinValue;
                    periodEnd = DateTime.MaxValue;
                    break;
                default: // daily
                    normPeriod = "daily";
                    periodStart = todayUtc;
                    periodEnd = tomorrowUtc;
                    break;
            }

            // 1. Appointments Query for the selected period (Sargable half-open range)
            var periodAppointments = await _context.TblAppointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= periodStart && a.Datetime < periodEnd)
                .OrderBy(a => a.Datetime)
                .ToListAsync(cancellationToken);

            // 2. Walk-in vs Online Booking Analysis
            int walkInCount = 0;
            int onlineCount = 0;
            foreach (var appt in periodAppointments)
            {
                if (appt.CreatedAt.HasValue && appt.CreatedAt.Value.Date == appt.Datetime.Date)
                {
                    walkInCount++;
                }
                else
                {
                    onlineCount++;
                }
            }

            var totalPatientsCount = periodAppointments
                .Select(a => a.PatientId)
                .Distinct()
                .Count();

            // 3. Today's active appointments for the live queue and upcoming list
            var todayAppointments = normPeriod == "daily" 
                ? periodAppointments 
                : await GetTodayAppointmentsAsync(todayUtc, tomorrowUtc, cancellationToken);
            
            var upcomingList = GetUpcomingPatients(todayAppointments);

            // 4. Inventory Alerts
            var (lowStockMeds, expiringBatches) = await GetInventoryAlertsAsync(todayDateOnly, thirtyDaysFromNow, cancellationToken);

            // 5. Income calculation for the selected period
            var periodPayments = await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.PaymentStatus == "paid" && p.PaidAt.HasValue && p.PaidAt.Value >= periodStart && p.PaidAt.Value < periodEnd)
                .ToListAsync(cancellationToken);

            var totalIncome = periodPayments.Sum(p => p.Amount);

            // Doctor consultation fees (consultation portion or standalone consult payments)
            var doctorConsultationFees = periodPayments
                .Where(p => p.PrescriptionId == null || p.Charges > 0)
                .Sum(p => p.Charges > 0 ? p.Charges : p.Amount);

            // Payment Breakdown (Cash vs Digital)
            var cashPayments = periodPayments.Where(p => string.Equals(p.PaymentMethod, "cash", StringComparison.OrdinalIgnoreCase)).ToList();
            var digitalPayments = periodPayments.Where(p => !string.Equals(p.PaymentMethod, "cash", StringComparison.OrdinalIgnoreCase)).ToList();

            var paymentBreakdown = new PaymentBreakdownDto
            {
                CashTotal = cashPayments.Sum(p => p.Amount),
                DigitalTotal = digitalPayments.Sum(p => p.Amount),
                CashCount = cashPayments.Count,
                DigitalCount = digitalPayments.Count
            };

            // Today's daily revenue for backward compatibility
            var dailyRevenue = normPeriod == "daily" 
                ? totalIncome 
                : await GetDailyRevenueAsync(todayUtc, tomorrowUtc, cancellationToken);

            // All-time Total Revenue
            var totalRevenueDouble = await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.PaymentStatus == "paid")
                .Select(p => (double)p.Amount)
                .SumAsync(cancellationToken);

            var totalRevenue = (decimal)totalRevenueDouble;

            // Total registered medicines
            var totalMedicinesCount = await _context.TblMedicines
                .AsNoTracking()
                .CountAsync(m => m.DeleteFlag != true, cancellationToken);

            var stockRiskStatus = lowStockMeds.Count > 0 ? "At Risk" : "Safe";

            return Result<DoctorDashboardResponse>.Success(new DoctorDashboardResponse
            {
                Period = normPeriod,
                TotalIncome = totalIncome,
                DailyRevenue = dailyRevenue,
                TotalRevenue = totalRevenue,
                DoctorConsultationFees = doctorConsultationFees,
                TotalAppointmentsCount = periodAppointments.Count,
                TodayAppointmentsCount = todayAppointments.Count,
                TotalPatientsCount = totalPatientsCount,
                TodayPatientsCount = todayAppointments.Select(a => a.PatientId).Distinct().Count(),
                WalkInPatientsCount = walkInCount,
                OnlineBookingCount = onlineCount,
                PaymentBreakdown = paymentBreakdown,
                NextPatients = upcomingList,
                LowStockAlertsCount = lowStockMeds.Count,
                ExpiringBatchesCount = expiringBatches.Count,
                TotalMedicinesCount = totalMedicinesCount,
                StockRiskStatus = stockRiskStatus,
                LowStockAlerts = lowStockMeds,
                ExpiringBatchesAlerts = expiringBatches
            });
        }

        public async Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId, CancellationToken cancellationToken = default)
        {
            var patients = await GetPatientProfilesAsync(userId, cancellationToken);
            var patientIds = patients.Select(p => p.PatientId).ToList();

            var upcomingResponseList = await GetUpcomingAppointmentsAsync(patientIds, cancellationToken);
            var prescriptionResponseList = await GetPrescriptionHistoryAsync(patientIds, cancellationToken);
            var outstandingPayments = await GetOutstandingBalancesAsync(patientIds, cancellationToken);

            return Result<PatientDashboardResponse>.Success(new PatientDashboardResponse
            {
                PatientProfiles = patients.Select(MapPatientToResponse).ToList(),
                UpcomingAppointments = upcomingResponseList,
                PrescriptionHistory = prescriptionResponseList,
                OutstandingBalances = outstandingPayments
            });
        }

        // --- Private Helper Methods for Doctor Dashboard ---

        private async Task<List<TblAppointment>> GetTodayAppointmentsAsync(DateTime start, DateTime end, CancellationToken cancellationToken)
        {
            return await _context.TblAppointments
                .AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= start && a.Datetime < end)
                .OrderBy(a => a.Id)
                .ToListAsync(cancellationToken);
        }

        private static List<UpcomingPatientDto> GetUpcomingPatients(List<TblAppointment> todayAppointments)
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

        private async Task<(List<string> LowStock, List<string> Expiring)> GetInventoryAlertsAsync(DateOnly today, DateOnly thirtyDaysFromNow, CancellationToken cancellationToken)
        {
            var activeBatches = await _context.TblMedicineBatches
                .AsNoTracking()
                .Include(b => b.Med)
                .Where(b => b.Status == "active" && b.ExpiryDate > today && b.DeleteFlag != true)
                .ToListAsync(cancellationToken);

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

        private async Task<decimal> GetDailyRevenueAsync(DateTime start, DateTime end, CancellationToken cancellationToken)
        {
            var amounts = await _context.TblPayments
                .AsNoTracking()
                .Where(p => p.PaymentStatus == "paid" && p.PaidAt.HasValue && p.PaidAt.Value >= start && p.PaidAt.Value < end)
                .Select(p => p.Amount)
                .ToListAsync(cancellationToken);
            return amounts.Sum();
        }

        // --- Private Helper Methods for Patient Dashboard ---

        private async Task<List<TblPatient>> GetPatientProfilesAsync(int userId, CancellationToken cancellationToken)
        {
            return await _context.TblPatients
                .AsNoTracking()
                .Where(p => p.UserId == userId && p.DeleteFlag != true)
                .ToListAsync(cancellationToken);
        }

        private async Task<List<AppointmentDetailsResponse>> GetUpcomingAppointmentsAsync(List<int> patientIds, CancellationToken cancellationToken)
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
                .ToListAsync(cancellationToken);

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
                .ToListAsync(cancellationToken);

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

        private async Task<List<PrescriptionResponse>> GetPrescriptionHistoryAsync(List<int> patientIds, CancellationToken cancellationToken)
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
                .ToListAsync(cancellationToken);

            return prescriptions.Select(MapPrescriptionToResponse).ToList();
        }

        private async Task<List<UnpaidInvoiceDto>> GetOutstandingBalancesAsync(List<int> patientIds, CancellationToken cancellationToken)
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
                .ToListAsync(cancellationToken);
        }

        // --- Mappers ---

        private static PatientProfileResponse MapPatientToResponse(TblPatient p)
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

        private static PrescriptionResponse MapPrescriptionToResponse(TblPrescription p)
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
