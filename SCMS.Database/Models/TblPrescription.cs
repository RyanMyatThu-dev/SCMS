using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblPrescription
{
    public int Id { get; set; }

    public int AppointmentId { get; set; }

    public int PatientId { get; set; }

    public int? DiseaseId { get; set; }

    public double? WeightKg { get; set; }

    public int? BloodPressureSystolic { get; set; }

    public int? BloodPressureDiastolic { get; set; }

    public string? Notes { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblAppointment Appointment { get; set; } = null!;

    public virtual TblDisease? Disease { get; set; }

    public virtual TblPatient Patient { get; set; } = null!;

    public virtual ICollection<TblFollowUp> TblFollowUps { get; set; } = new List<TblFollowUp>();

    public virtual ICollection<TblLabReport> TblLabReports { get; set; } = new List<TblLabReport>();

    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    public virtual ICollection<TblPrescriptionItem> TblPrescriptionItems { get; set; } = new List<TblPrescriptionItem>();
}
