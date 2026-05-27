using System;

namespace SCMS.Database.Models;

public partial class TblFollowUp
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public int? AppointmentId { get; set; }

    public int? PrescriptionId { get; set; }

    public DateTime DueAt { get; set; }

    public string Recommendation { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? CompletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblAppointment? Appointment { get; set; }

    public virtual TblPatient Patient { get; set; } = null!;

    public virtual TblPrescription? Prescription { get; set; }
}
