using System;

namespace SCMS.Domain.Features.Prescriptions.Models
{
    public class PrescriptionItemDto
    {
        public int MedicineId { get; set; }
        public string? Dosage { get; set; }
        public int Days { get; set; }
        public int Quantity { get; set; }
        public string? Instruction { get; set; }

        // Schedule details (maps to TblPrescriptionItemSchedule)
        public string? DoseTime { get; set; } // morning / afternoon / evening / night / bedtime / custom
        public decimal DoseQuantity { get; set; } = 1.0m;
        public string? DoseUnit { get; set; } // tablet / capsule / ml / drop / puff / injection
        public string? MealTiming { get; set; } // before_meal / after_meal / with_meal / anytime
        public string? Route { get; set; } // oral / topical / injection / eye_drop / ear_drop / inhalation
        public int? IntervalHours { get; set; }
        public int? IntervalDays { get; set; }
        public string? DayOfWeek { get; set; }
        public bool IsAsNeeded { get; set; }
        public string? BodySite { get; set; }
        public string? ScheduleNote { get; set; }
    }
}
