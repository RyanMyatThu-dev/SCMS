using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblNotification
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? ActionRoute { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblUser? User { get; set; }
}
