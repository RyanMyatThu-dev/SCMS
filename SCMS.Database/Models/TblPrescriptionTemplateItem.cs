using System;

namespace SCMS.Database.Models;

public partial class TblPrescriptionTemplateItem
{
    public int Id { get; set; }

    public int TemplateId { get; set; }

    public int MedicineId { get; set; }

    public string? Dosage { get; set; }

    public int Days { get; set; }

    public int Quantity { get; set; }

    public string? Instruction { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblMedicine Medicine { get; set; } = null!;

    public virtual TblPrescriptionTemplate Template { get; set; } = null!;
}
