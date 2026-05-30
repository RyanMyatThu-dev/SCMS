using System;

namespace SCMS.Shared.Contracts.Patients
{
    public class PatientProfileResponse
    {
        public int PatientId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = null!;
        public string? MobileNo { get; set; }
        public string? Email { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? BloodType { get; set; }
        public string? ActualAddress { get; set; }

        // Medical History details (deserialized from Address)
        public string? Allergies { get; set; }
        public string? ChronicConditions { get; set; }
        public string? PastSurgeries { get; set; }
        public string? FamilyHistory { get; set; }
        public string? VaccinationHistory { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
