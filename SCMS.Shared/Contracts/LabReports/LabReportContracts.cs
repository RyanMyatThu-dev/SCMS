namespace SCMS.Shared.Contracts.LabReports
{
    public class LabReportRequest
    {
        public int PatientId { get; set; }
        public int? AppointmentId { get; set; }
        public int? PrescriptionId { get; set; }
        public string TestName { get; set; } = null!;
        public string? Notes { get; set; }
        public DateTime? DueAt { get; set; }
    }

    public class LabReportResultRequest
    {
        public string ResultSummary { get; set; } = null!;
        public string? AttachmentUrl { get; set; }
    }

    public class LabReportResponse
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public int? AppointmentId { get; set; }
        public int? PrescriptionId { get; set; }
        public string TestName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public string? ResultSummary { get; set; }
        public string? AttachmentUrl { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
