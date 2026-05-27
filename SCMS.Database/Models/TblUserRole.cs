using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblUserRole
{
    public int Id { get; set; }

    public int UserId { get; set; }

    /// <summary>
    /// admin / doctor / patient / user
    /// </summary>
    public string Role { get; set; } = null!;

    public virtual ICollection<TblRolePermission> TblRolePermissions { get; set; } = new List<TblRolePermission>();

    public virtual TblUser User { get; set; } = null!;
}
