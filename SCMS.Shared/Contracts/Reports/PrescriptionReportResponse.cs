using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class PrescriptionReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public DateTime GeneratedAt { get; set; }
        public int TotalPrescriptions { get; set; }
        public int TotalMedicines { get; set; }
        public int DistinctPatients { get; set; }
        public List<PrescriptionReportItemDto> Items { get; set; } = new();
    }

    public class PrescriptionReportItemDto
    {
        public int Id { get; set; }
        public string PatientName { get; set; } = null!;
        public string AppointmentCode { get; set; } = null!;
        public string? DiseaseName { get; set; }
        public DateTime CreatedAt { get; set; }
        public int MedicineCount { get; set; }
        public int TotalQuantity { get; set; }
    }
}
