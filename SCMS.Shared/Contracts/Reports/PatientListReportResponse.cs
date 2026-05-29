using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class PatientListReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public DateTime GeneratedAt { get; set; }

        // ── Summary ─────────────────────────────────────────
        public int TotalPatients { get; set; }
        public int MaleCount { get; set; }
        public int FemaleCount { get; set; }
        public int OtherGenderCount { get; set; }

        public List<PatientListItemDto> Items { get; set; } = new();
    }

    public class PatientListItemDto
    {
        public int PatientId { get; set; }
        public string Name { get; set; } = null!;
        public int? Age { get; set; }
        public string Gender { get; set; } = null!;
        public string BloodType { get; set; } = null!;
        public string? MobileNo { get; set; }
        public string? Email { get; set; }
        public DateTime RegisteredAt { get; set; }
    }
}
