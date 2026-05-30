using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblMedicineCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<TblMedicine> TblMedicines { get; set; } = new List<TblMedicine>();
}
