using System.Collections.Generic;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared.Contracts.Prescriptions;

namespace SCMS.Domain.DTOs
{
    /// <summary>
    /// Comprehensive operational and clinical dashboard summary response for staff and doctors.
    /// </summary>
    public class DoctorDashboardResponse
    {
        /// <summary>
        /// Selected aggregation period: "daily", "weekly", "monthly", or "all".
        /// </summary>
        public string Period { get; set; } = "daily";

        /// <summary>
        /// Total clinic income collected within the specified period.
        /// </summary>
        public decimal TotalIncome { get; set; }

        /// <summary>
        /// Backward-compatible alias for daily collected revenue.
        /// </summary>
        public decimal DailyRevenue { get; set; }

        /// <summary>
        /// All-time collected clinic revenue.
        /// </summary>
        public decimal TotalRevenue { get; set; }

        /// <summary>
        /// Total consultation fees earned by the doctor within the specified period.
        /// </summary>
        public decimal DoctorConsultationFees { get; set; }

        /// <summary>
        /// Total appointments scheduled within the specified period.
        /// </summary>
        public int TotalAppointmentsCount { get; set; }

        /// <summary>
        /// Backward-compatible alias for today's appointment count.
        /// </summary>
        public int TodayAppointmentsCount { get; set; }

        /// <summary>
        /// Distinct patients attended or scheduled within the specified period.
        /// </summary>
        public int TotalPatientsCount { get; set; }

        /// <summary>
        /// Backward-compatible alias for today's patient count.
        /// </summary>
        public int TodayPatientsCount { get; set; }

        /// <summary>
        /// Walk-in patients registered at the clinic counter on the same day.
        /// </summary>
        public int WalkInPatientsCount { get; set; }

        /// <summary>
        /// Pre-booked online appointments scheduled ahead of time.
        /// </summary>
        public int OnlineBookingCount { get; set; }

        /// <summary>
        /// Breakdown of collected income by payment method (Cash vs Digital).
        /// </summary>
        public PaymentBreakdownDto PaymentBreakdown { get; set; } = new();

        /// <summary>
        /// List of the next queued patients for active consultation.
        /// </summary>
        public List<UpcomingPatientDto> NextPatients { get; set; } = new();

        /// <summary>
        /// Total medicines with stock levels below the minimum threshold.
        /// </summary>
        public int LowStockAlertsCount { get; set; }

        /// <summary>
        /// Total medicine batches nearing expiration within 30 days.
        /// </summary>
        public int ExpiringBatchesCount { get; set; }

        /// <summary>
        /// Total active medicines registered in the clinic inventory.
        /// </summary>
        public int TotalMedicinesCount { get; set; }

        /// <summary>
        /// Overall stock health status ("Safe" or "At Risk").
        /// </summary>
        public string StockRiskStatus { get; set; } = "Safe";

        /// <summary>
        /// Itemized warnings for low-stock medicines.
        /// </summary>
        public List<string> LowStockAlerts { get; set; } = new();

        /// <summary>
        /// Itemized warnings for near-expiry medicine batches.
        /// </summary>
        public List<string> ExpiringBatchesAlerts { get; set; } = new();
    }

    /// <summary>
    /// Breakdown of payment methods and transaction volumes.
    /// </summary>
    public class PaymentBreakdownDto
    {
        /// <summary>
        /// Total income collected via physical cash.
        /// </summary>
        public decimal CashTotal { get; set; }

        /// <summary>
        /// Total income collected via digital payments (KPay, WavePay, Gateway).
        /// </summary>
        public decimal DigitalTotal { get; set; }

        /// <summary>
        /// Number of cash transactions.
        /// </summary>
        public int CashCount { get; set; }

        /// <summary>
        /// Number of digital payment transactions.
        /// </summary>
        public int DigitalCount { get; set; }
    }

    /// <summary>
    /// Represents an upcoming patient in the consultation queue.
    /// </summary>
    public class UpcomingPatientDto
    {
        public int Id { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string Datetime { get; set; } = null!;
        public int TokenNumber { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Summary response for the patient mobile/web dashboard.
    /// </summary>
    public class PatientDashboardResponse
    {
        public List<PatientProfileResponse> PatientProfiles { get; set; } = new();
        public List<AppointmentDetailsResponse> UpcomingAppointments { get; set; } = new();
        public List<PrescriptionResponse> PrescriptionHistory { get; set; } = new();
        public List<UnpaidInvoiceDto> OutstandingBalances { get; set; } = new();
    }

    /// <summary>
    /// Details of an unpaid invoice or pending balance.
    /// </summary>
    public class UnpaidInvoiceDto
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
    }
}
