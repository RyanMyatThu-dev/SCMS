using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Patients
{
    public class MedicalSummaryResponse
    {
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? BloodType { get; set; }
        
        // Medical background
        public string? Allergies { get; set; }
        public string? ChronicConditions { get; set; }
        public string? PastSurgeries { get; set; }
        public string? FamilyHistory { get; set; }
        public string? VaccinationHistory { get; set; }

        public List<PatientVitalsHistoryDto> VitalsHistory { get; set; } = new();
        public List<ActivePrescriptionSummaryDto> ActivePrescriptions { get; set; } = new();
    }

    public class PatientVitalsHistoryDto
    {
        public DateTime Date { get; set; }
        public double? WeightKg { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public double? TemperatureC { get; set; }
        public int? PulseBpm { get; set; }
        public int? Spo2Percent { get; set; }
        public double? HeightCm { get; set; }
        public double? Bmi { get; set; }
    }

    public class ActivePrescriptionSummaryDto
    {
        public int PrescriptionId { get; set; }
        public DateTime Date { get; set; }
        public string DiseaseName { get; set; } = null!;
        public List<string> Medicines { get; set; } = new();
    }
}
