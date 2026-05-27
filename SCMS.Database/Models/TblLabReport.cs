using System;

namespace SCMS.Database.Models;

public partial class TblLabReport
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public int? AppointmentId { get; set; }

    public int? PrescriptionId { get; set; }

    public string TestName { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public string? ResultSummary { get; set; }

    public string? AttachmentUrl { get; set; }

    public DateTime? DueAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblAppointment? Appointment { get; set; }

    public virtual TblPatient Patient { get; set; } = null!;

    public virtual TblPrescription? Prescription { get; set; }
}
