using System;

namespace SCMS.Shared.Contracts.Reports
{
    public class AppointmentReportRequest
    {
        /// <summary>"daily" or "weekly"</summary>
        public string ReportType { get; set; } = "daily";

        /// <summary>The target date for daily report, or the start-of-week date for weekly.</summary>
        public DateTime? Date { get; set; }
    }
}
