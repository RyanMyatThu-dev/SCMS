using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblUserToken
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public bool Revoked { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
