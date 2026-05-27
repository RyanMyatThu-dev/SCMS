using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblPermission
{
    public int Id { get; set; }

    public string Menu { get; set; } = null!;

    public string Action { get; set; } = null!;

    public virtual ICollection<TblRolePermission> TblRolePermissions { get; set; } = new List<TblRolePermission>();
}
