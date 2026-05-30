using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class FollowUpReportRequest
    {
        /// <summary>The start date for the report period.</summary>
        public DateTime? StartDate { get; set; }

        /// <summary>The end date for the report period (inclusive). If null, same as StartDate (single day).</summary>
        public DateTime? EndDate { get; set; }
        
        /// <summary>"pending", "completed", or "all"</summary>
        public string Status { get; set; } = "all";
    }

    public class FollowUpReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public DateTime PeriodStart { get; set; }
        public DateTime? PeriodEnd { get; set; }
        public DateTime GeneratedAt { get; set; }

        // ── Summary ─────────────────────────────────────────
        public int TotalFollowUps { get; set; }
        public int PendingCount { get; set; }
        public int CompletedCount { get; set; }
        public int OverdueCount { get; set; }

        public List<FollowUpItemDto> Items { get; set; } = new();
    }

    public class FollowUpItemDto
    {
        public int FollowUpId { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public string? MobileNo { get; set; }
        public DateTime DueAt { get; set; }
        public string Recommendation { get; set; } = null!;
        public string Status { get; set; } = null!;
        public bool IsOverdue { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
