using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class RevenueReportRequest
    {
        /// <summary>"daily", "weekly", or "monthly"</summary>
        public string ReportType { get; set; } = "daily";

        /// <summary>The target date (used to derive the day, week, or month period).</summary>
        public DateTime? Date { get; set; }
    }

    public class RevenueReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public string ReportType { get; set; } = null!;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime GeneratedAt { get; set; }

        // ── Totals ──────────────────────────────────────────
        public int TotalTransactions { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TotalTax { get; set; }
        public decimal TotalCharges { get; set; }
        public decimal GrandTotal { get; set; }

        // ── By payment method ───────────────────────────────
        public List<RevenueByMethodDto> ByMethod { get; set; } = new();

        // ── Individual payment line items ───────────────────
        public List<RevenueLineItemDto> Items { get; set; } = new();
    }

    public class RevenueByMethodDto
    {
        public string PaymentMethod { get; set; } = null!;
        public int Count { get; set; }
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public decimal Total { get; set; }
    }

    public class RevenueLineItemDto
    {
        public int PaymentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public decimal Total { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
