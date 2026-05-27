using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblRolePermission
{
    public int Id { get; set; }

    public int RoleId { get; set; }

    public int PermissionId { get; set; }

    public virtual TblPermission Permission { get; set; } = null!;

    public virtual TblUserRole Role { get; set; } = null!;
}
