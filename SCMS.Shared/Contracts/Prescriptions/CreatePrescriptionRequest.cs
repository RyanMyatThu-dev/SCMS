using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Prescriptions
{
    public class CreatePrescriptionRequest
    {
        public int AppointmentId { get; set; }
        public int PatientId { get; set; }
        public int? DiseaseId { get; set; }
        public double? WeightKg { get; set; }
        public int? BloodPressureSystolic { get; set; }
        public int? BloodPressureDiastolic { get; set; }
        public string? Notes { get; set; }

        // Additional Vitals (stored in serialized Notes)
        public double? TemperatureC { get; set; }
        public int? PulseBpm { get; set; }
        public int? Spo2Percent { get; set; }
        public double? HeightCm { get; set; }
        public string? LabTestRequests { get; set; }

        public List<PrescriptionItemDto> Items { get; set; } = new();
    }
}
