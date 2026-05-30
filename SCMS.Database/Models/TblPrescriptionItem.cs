using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblPrescriptionItem
{
    public int Id { get; set; }

    public int PrescriptionId { get; set; }

    public int MedicineId { get; set; }

    public int? MedicineBatchId { get; set; }

    public string? Dosage { get; set; }

    public int Days { get; set; }

    public int Quantity { get; set; }

    public string? Instruction { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblMedicine Medicine { get; set; } = null!;

    public virtual TblMedicineBatch? MedicineBatch { get; set; }

    public virtual TblPrescription Prescription { get; set; } = null!;

    public virtual ICollection<TblPrescriptionItemSchedule> TblPrescriptionItemSchedules { get; set; } = new List<TblPrescriptionItemSchedule>();
}
