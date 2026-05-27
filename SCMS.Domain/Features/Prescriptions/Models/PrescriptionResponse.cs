using System;
using System.Collections.Generic;

namespace SCMS.Domain.Features.Prescriptions.Models
{
    public class PrescriptionResponse
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public int? DiseaseId { get; set; }
        public string? DiseaseName { get; set; }
        public double? WeightKg { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public string? Notes { get; set; }

        // Vitals parsed from notes
        public double? TemperatureC { get; set; }
        public int? PulseBpm { get; set; }
        public int? Spo2Percent { get; set; }
        public double? HeightCm { get; set; }
        public double? Bmi { get; set; }
        public string? LabTestRequests { get; set; }

        public List<PrescriptionItemResponseDto> Items { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class PrescriptionItemResponseDto
    {
        public int Id { get; set; }
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public int? MedicineBatchId { get; set; }
        public string? BatchNo { get; set; }
        public string? Dosage { get; set; }
        public int Days { get; set; }
        public int Quantity { get; set; }
        public string? Instruction { get; set; }

        // Schedule
        public string? DoseTime { get; set; }
        public decimal DoseQuantity { get; set; }
        public string? DoseUnit { get; set; }
        public string? MealTiming { get; set; }
        public string? Route { get; set; }
        public int? IntervalHours { get; set; }
        public int? IntervalDays { get; set; }
        public string? DayOfWeek { get; set; }
        public bool IsAsNeeded { get; set; }
        public string? BodySite { get; set; }
        public string? ScheduleNote { get; set; }
    }
}
