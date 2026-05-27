using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblDisease
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual ICollection<TblPrescription> TblPrescriptions { get; set; } = new List<TblPrescription>();

    public virtual ICollection<TblPrescriptionTemplate> TblPrescriptionTemplates { get; set; } = new List<TblPrescriptionTemplate>();
}
