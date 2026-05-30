using System;
using System.Collections.Generic;

namespace SCMS.Database.Models;

public partial class TblPrescriptionItemSchedule
{
    public int Id { get; set; }

    public int PrescriptionItemId { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    /// <summary>
    /// morning / afternoon / evening / night / bedtime / custom
    /// </summary>
    public string? DoseTime { get; set; }

    public decimal DoseQuantity { get; set; }

    /// <summary>
    /// tablet / capsule / ml / drop / puff / injection
    /// </summary>
    public string? DoseUnit { get; set; }

    /// <summary>
    /// before_meal / after_meal / with_meal / anytime
    /// </summary>
    public string? MealTiming { get; set; }

    /// <summary>
    /// oral / topical / injection / eye_drop / ear_drop / inhalation
    /// </summary>
    public string? Route { get; set; }

    /// <summary>
    /// Every X hours
    /// </summary>
    public int? IntervalHours { get; set; }

    /// <summary>
    /// Every X days
    /// </summary>
    public int? IntervalDays { get; set; }

    public string? DayOfWeek { get; set; }

    /// <summary>
    /// Take when needed
    /// </summary>
    public bool? IsAsNeeded { get; set; }

    /// <summary>
    /// left eye / right ear / skin area
    /// </summary>
    public string? BodySite { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool? DeleteFlag { get; set; }

    public virtual TblPrescriptionItem PrescriptionItem { get; set; } = null!;
}
