using System;

namespace SCMS.Shared.Contracts.Reports
{
    public class BusinessSummaryReportRequest
    {
        /// <summary>Month (1-12). Defaults to current month.</summary>
        public int? Month { get; set; }

        /// <summary>Year (e.g. 2026). Defaults to current year.</summary>
        public int? Year { get; set; }
    }

    public class BusinessSummaryReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime GeneratedAt { get; set; }

        public int NewPatients { get; set; }
        public int TotalPatients { get; set; }
        
        public int TotalAppointments { get; set; }
        public int TotalPrescriptions { get; set; }

        public decimal TotalIncome { get; set; }
        public decimal TotalTax { get; set; }
        public decimal TotalCharges { get; set; }
    }
}
