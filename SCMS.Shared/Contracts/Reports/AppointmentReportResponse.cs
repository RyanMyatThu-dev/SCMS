using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class AppointmentReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public string ReportType { get; set; } = null!;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime GeneratedAt { get; set; }

        public int TotalAppointments { get; set; }
        public int PendingCount { get; set; }
        public int ConfirmedCount { get; set; }
        public int CompletedCount { get; set; }
        public int CancelledCount { get; set; }

        public List<AppointmentReportItemDto> Items { get; set; } = new();
    }

    public class AppointmentReportItemDto
    {
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public DateTime Datetime { get; set; }
        public string Status { get; set; } = null!;
        public int TokenNumber { get; set; }
        public string? Notes { get; set; }
    }
}
