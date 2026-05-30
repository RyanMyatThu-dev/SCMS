using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblPrescriptionTemplate
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int DiseaseId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblDisease Disease { get; set; } = null!;

    public virtual ICollection<TblPrescriptionTemplateItem> TblPrescriptionTemplateItems { get; set; } = new List<TblPrescriptionTemplateItem>();
}
