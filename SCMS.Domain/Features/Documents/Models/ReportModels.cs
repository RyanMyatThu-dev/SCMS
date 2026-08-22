using System;
using System.Collections.Generic;

namespace SCMS.Domain.Features.Documents.Models
{
    /// <summary>Request parameters for generating an appointment summary report.</summary>
    public sealed record AppointmentReportRequest
    {
        public string ReportType { get; init; } = "daily"; // "daily", "weekly", "monthly", or "custom"
        public DateTime? Date { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public int? Month { get; init; }
        public int? Year { get; init; }
    }

    /// <summary>Report response containing appointment statistics and line items.</summary>
    public sealed record AppointmentReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public string ReportType { get; init; } = null!;
        public DateTime PeriodStart { get; init; }
        public DateTime PeriodEnd { get; init; }
        public DateTime GeneratedAt { get; init; }

        public int TotalAppointments { get; init; }
        public int PendingCount { get; init; }
        public int ConfirmedCount { get; init; }
        public int CompletedCount { get; init; }
        public int CancelledCount { get; init; }

        public List<AppointmentReportItemDto> Items { get; init; } = new();
    }

    public sealed record AppointmentReportItemDto
    {
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public string PatientName { get; init; } = null!;
        public DateTime Datetime { get; init; }
        public string Status { get; init; } = null!;
        public int TokenNumber { get; init; }
        public string? Notes { get; init; }
    }

    /// <summary>Request parameters for generating a revenue summary report.</summary>
    public sealed record RevenueReportRequest
    {
        public string ReportType { get; init; } = "daily"; // "daily", "weekly", "monthly", or "custom"
        public DateTime? Date { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public int? Month { get; init; }
        public int? Year { get; init; }
    }

    /// <summary>Report response containing clinic revenue analytics and breakdown.</summary>
    public sealed record RevenueReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public string ReportType { get; init; } = null!;
        public DateTime PeriodStart { get; init; }
        public DateTime PeriodEnd { get; init; }
        public DateTime GeneratedAt { get; init; }

        public int TotalTransactions { get; init; }
        public decimal TotalAmount { get; init; }
        public decimal TotalTax { get; init; }
        public decimal TotalCharges { get; init; }
        public decimal GrandTotal { get; init; }

        public List<RevenueByMethodDto> ByMethod { get; init; } = new();
        public List<RevenueLineItemDto> Items { get; init; } = new();
    }

    public sealed record RevenueByMethodDto
    {
        public string PaymentMethod { get; init; } = null!;
        public int Count { get; init; }
        public decimal Amount { get; init; }
        public decimal Tax { get; init; }
        public decimal Charges { get; init; }
        public decimal Total { get; init; }
    }

    public sealed record RevenueLineItemDto
    {
        public int PaymentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public string PatientName { get; init; } = null!;
        public string PaymentMethod { get; init; } = null!;
        public string PaymentStatus { get; init; } = null!;
        public decimal Amount { get; init; }
        public decimal Tax { get; init; }
        public decimal Charges { get; init; }
        public decimal Total { get; init; }
        public DateTime? PaidAt { get; init; }
    }

    /// <summary>Report response listing all registered patients with demographic breakdown.</summary>
    public sealed record PatientListReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public DateTime GeneratedAt { get; init; }

        public int TotalPatients { get; init; }
        public int MaleCount { get; init; }
        public int FemaleCount { get; init; }
        public int OtherGenderCount { get; init; }

        public List<PatientListItemDto> Items { get; init; } = new();
    }

    public sealed record PatientListItemDto
    {
        public int PatientId { get; init; }
        public string Name { get; init; } = null!;
        public int? Age { get; init; }
        public string Gender { get; init; } = null!;
        public string BloodType { get; init; } = null!;
        public string? MobileNo { get; init; }
        public string? Email { get; init; }
        public DateTime RegisteredAt { get; init; }
    }

    /// <summary>Report response containing medicine stock inventory and batch statuses.</summary>
    public sealed record MedicineStockReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public DateTime GeneratedAt { get; init; }

        public int TotalMedicines { get; init; }
        public int TotalBatches { get; init; }
        public int LowStockCount { get; init; }
        public int ExpiredCount { get; init; }

        public List<MedicineStockItemDto> Items { get; init; } = new();
    }

    public sealed record MedicineStockItemDto
    {
        public int MedicineId { get; init; }
        public string Name { get; init; } = null!;
        public string Category { get; init; } = null!;
        public int TotalQuantity { get; init; }
        public List<MedicineBatchStockDto> Batches { get; init; } = new();
    }

    public sealed record MedicineBatchStockDto
    {
        public int BatchId { get; init; }
        public string BatchNo { get; init; } = null!;
        public int Quantity { get; init; }
        public DateOnly ExpiryDate { get; init; }
        public string Status { get; init; } = null!;
        public bool IsExpired { get; init; }
        public bool IsLowStock { get; init; }
    }

    /// <summary>Request parameters for filtering follow-up reports.</summary>
    public sealed record FollowUpReportRequest
    {
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public string Status { get; init; } = "all";
    }

    /// <summary>Report response listing scheduled follow-ups and completion metrics.</summary>
    public sealed record FollowUpReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public DateTime PeriodStart { get; init; }
        public DateTime? PeriodEnd { get; init; }
        public DateTime GeneratedAt { get; init; }

        public int TotalFollowUps { get; init; }
        public int PendingCount { get; init; }
        public int CompletedCount { get; init; }
        public int OverdueCount { get; init; }

        public List<FollowUpItemDto> Items { get; init; } = new();
    }

    public sealed record FollowUpItemDto
    {
        public int FollowUpId { get; init; }
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public string? MobileNo { get; init; }
        public DateTime DueAt { get; init; }
        public string Recommendation { get; init; } = null!;
        public string Status { get; init; } = null!;
        public bool IsOverdue { get; init; }
        public DateTime? CompletedAt { get; init; }
    }

    /// <summary>Report response summarizing prescription activity and medication volume.</summary>
    public sealed record PrescriptionReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public DateTime GeneratedAt { get; init; }
        public int TotalPrescriptions { get; init; }
        public int TotalMedicines { get; init; }
        public int DistinctPatients { get; init; }
        public List<PrescriptionReportItemDto> Items { get; init; } = new();
    }

    public sealed record PrescriptionReportItemDto
    {
        public int Id { get; init; }
        public string PatientName { get; init; } = null!;
        public string AppointmentCode { get; init; } = null!;
        public string? DiseaseName { get; init; }
        public DateTime CreatedAt { get; init; }
        public int MedicineCount { get; init; }
        public int TotalQuantity { get; init; }
    }

    /// <summary>Request parameters for monthly business summary report.</summary>
    public sealed record BusinessSummaryReportRequest
    {
        public int? Month { get; init; }
        public int? Year { get; init; }
    }

    /// <summary>Report response summarizing high-level monthly operational and financial performance.</summary>
    public sealed record BusinessSummaryReportResponse
    {
        public string ReportTitle { get; init; } = null!;
        public DateTime PeriodStart { get; init; }
        public DateTime PeriodEnd { get; init; }
        public DateTime GeneratedAt { get; init; }

        public int NewPatients { get; init; }
        public int TotalPatients { get; init; }
        
        public int TotalAppointments { get; init; }
        public int TotalPrescriptions { get; init; }

        public decimal TotalIncome { get; init; }
        public decimal TotalTax { get; init; }
        public decimal TotalCharges { get; init; }
    }
}
