using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblMedicineBatch
{
    public int Id { get; set; }

    public int MedId { get; set; }

    public string BatchNo { get; set; } = null!;

    public int Quantity { get; set; }

    public DateOnly ExpiryDate { get; set; }

    public DateOnly? ReceivedDate { get; set; }

    public string? SupplierName { get; set; }

    /// <summary>
    /// active / expired / disposed
    /// </summary>
    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblMedicine Med { get; set; } = null!;

    public virtual ICollection<TblPrescriptionItem> TblPrescriptionItems { get; set; } = new List<TblPrescriptionItem>();
}
