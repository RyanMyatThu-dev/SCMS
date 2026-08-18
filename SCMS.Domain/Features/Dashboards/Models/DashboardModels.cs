using System.Collections.Generic;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Domain.Features.Prescriptions.Models;

namespace SCMS.Domain.Features.Dashboards.Models
{
    /// <summary>
    /// Comprehensive operational and clinical dashboard summary response for staff and doctors.
    /// </summary>
    public sealed record DoctorDashboardResponse
    {
        /// <summary>
        /// Selected aggregation period: "daily", "weekly", "monthly", or "all".
        /// </summary>
        public string Period { get; init; } = "daily";

        /// <summary>
        /// Total clinic income collected within the specified period.
        /// </summary>
        public decimal TotalIncome { get; init; }

        /// <summary>
        /// Backward-compatible alias for daily collected revenue.
        /// </summary>
        public decimal DailyRevenue { get; init; }

        /// <summary>
        /// All-time collected clinic revenue.
        /// </summary>
        public decimal TotalRevenue { get; init; }

        /// <summary>
        /// Total consultation fees earned by the doctor within the specified period.
        /// </summary>
        public decimal DoctorConsultationFees { get; init; }

        /// <summary>
        /// Total appointments scheduled within the specified period.
        /// </summary>
        public int TotalAppointmentsCount { get; init; }

        /// <summary>
        /// Backward-compatible alias for today's appointment count.
        /// </summary>
        public int TodayAppointmentsCount { get; init; }

        /// <summary>
        /// Distinct patients attended or scheduled within the specified period.
        /// </summary>
        public int TotalPatientsCount { get; init; }

        /// <summary>
        /// Backward-compatible alias for today's patient count.
        /// </summary>
        public int TodayPatientsCount { get; init; }

        /// <summary>
        /// Walk-in patients registered at the clinic counter on the same day.
        /// </summary>
        public int WalkInPatientsCount { get; init; }

        /// <summary>
        /// Pre-booked online appointments scheduled ahead of time.
        /// </summary>
        public int OnlineBookingCount { get; init; }

        /// <summary>
        /// Breakdown of collected income by payment method (Cash vs Digital).
        /// </summary>
        public PaymentBreakdownDto PaymentBreakdown { get; init; } = new();

        /// <summary>
        /// List of the next queued patients for active consultation.
        /// </summary>
        public List<UpcomingPatientDto> NextPatients { get; init; } = new();

        /// <summary>
        /// Total medicines with stock levels below the minimum threshold.
        /// </summary>
        public int LowStockAlertsCount { get; init; }

        /// <summary>
        /// Total medicine batches nearing expiration within 30 days.
        /// </summary>
        public int ExpiringBatchesCount { get; init; }

        /// <summary>
        /// Total active medicines registered in the clinic inventory.
        /// </summary>
        public int TotalMedicinesCount { get; init; }

        /// <summary>
        /// Overall stock health status ("Safe" or "At Risk").
        /// </summary>
        public string StockRiskStatus { get; init; } = "Safe";

        /// <summary>
        /// Itemized warnings for low-stock medicines.
        /// </summary>
        public List<string> LowStockAlerts { get; init; } = new();

        /// <summary>
        /// Itemized warnings for near-expiry medicine batches.
        /// </summary>
        public List<string> ExpiringBatchesAlerts { get; init; } = new();
    }

    /// <summary>
    /// Breakdown of payment methods and transaction volumes.
    /// </summary>
    public sealed record PaymentBreakdownDto
    {
        public decimal CashTotal { get; init; }
        public decimal DigitalTotal { get; init; }
        public int CashCount { get; init; }
        public int DigitalCount { get; init; }
    }

    /// <summary>
    /// Represents an upcoming patient in the consultation queue.
    /// </summary>
    public sealed record UpcomingPatientDto
    {
        public int Id { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public string PatientName { get; init; } = null!;
        public string Datetime { get; init; } = null!;
        public int TokenNumber { get; init; }
        public string? Notes { get; init; }
    }

    /// <summary>
    /// Summary response for the patient mobile/web dashboard.
    /// </summary>
    public sealed record PatientDashboardResponse
    {
        public List<PatientProfileResponse> PatientProfiles { get; init; } = new();
        public List<AppointmentDetailsResponse> UpcomingAppointments { get; init; } = new();
        public List<PrescriptionResponse> PrescriptionHistory { get; init; } = new();
        public List<UnpaidInvoiceDto> OutstandingBalances { get; init; } = new();
    }

    /// <summary>
    /// Details of an unpaid invoice or pending balance.
    /// </summary>
    public sealed record UnpaidInvoiceDto
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public decimal Amount { get; init; }
        public decimal Tax { get; init; }
        public decimal Charges { get; init; }
        public string PaymentStatus { get; init; } = null!;
        public string PaymentMethod { get; init; } = null!;
    }
}
