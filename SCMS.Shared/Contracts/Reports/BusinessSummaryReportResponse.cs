using System;

namespace SCMS.Shared.Contracts.Reports
{
    public class BusinessSummaryReportRequest
    {
        /// <summary>The target date (used to derive the month).</summary>
        public DateTime? Date { get; set; }
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
