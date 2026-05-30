using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblUser
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? MobileNo { get; set; }

    public string? Email { get; set; }

    public string PasswordHash { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual ICollection<TblNotification> TblNotifications { get; set; } = new List<TblNotification>();

    public virtual ICollection<TblPatient> TblPatients { get; set; } = new List<TblPatient>();

    public virtual ICollection<TblUserRole> TblUserRoles { get; set; } = new List<TblUserRole>();

    public virtual ICollection<TblUserToken> TblUserTokens { get; set; } = new List<TblUserToken>();
}
