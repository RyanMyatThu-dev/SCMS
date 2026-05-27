using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblAppointment
{
    public int Id { get; set; }

    public string AppointmentCode { get; set; } = null!;

    public int PatientId { get; set; }

    public DateTime Datetime { get; set; }

    /// <summary>
    /// pending / confirmed / cancelled / completed
    /// </summary>
    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual TblPatient Patient { get; set; } = null!;

    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    public virtual ICollection<TblPrescription> TblPrescriptions { get; set; } = new List<TblPrescription>();
}
