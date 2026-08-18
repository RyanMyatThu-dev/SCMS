using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Patients.Models
{
    /// <summary>Request parameters for querying patient profiles with pagination and search.</summary>
    public class PatientProfilesRequest : PaginationRequest
    {
        public string? Search { get; set; }
    }

    /// <summary>Payload for creating or updating a patient profile.</summary>
    public sealed record PatientProfileRequest
    {
        [Required(ErrorMessage = "Patient name is required.")]
        public required string Name { get; init; }

        public string? MobileNo { get; init; }
        public string? Email { get; init; }
        public DateOnly? DateOfBirth { get; init; }
        public string? Gender { get; init; }
        public string? BloodType { get; init; }
        public string? ActualAddress { get; init; }

        public string? Allergies { get; init; }
        public string? ChronicConditions { get; init; }
        public string? PastSurgeries { get; init; }
        public string? FamilyHistory { get; init; }
        public string? VaccinationHistory { get; init; }
    }

    /// <summary>Patient profile detail response.</summary>
    public sealed record PatientProfileResponse
    {
        public int PatientId { get; init; }
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? MobileNo { get; init; }
        public string? Email { get; init; }
        public DateOnly? DateOfBirth { get; init; }
        public string? Gender { get; init; }
        public string? BloodType { get; init; }
        public string? ActualAddress { get; init; }

        public string? Allergies { get; init; }
        public string? ChronicConditions { get; init; }
        public string? PastSurgeries { get; init; }
        public string? FamilyHistory { get; init; }
        public string? VaccinationHistory { get; init; }

        public DateTime CreatedAt { get; init; }
    }

    /// <summary>Patient medical and visit history timeline response.</summary>
    public sealed record PatientHistoryResponse
    {
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public List<TimelineItemDto> Timeline { get; set; } = new();
    }

    public sealed record TimelineItemDto
    {
        public DateTime Date { get; init; }
        public string Type { get; init; } = null!;
        public string Title { get; init; } = null!;
        public string Description { get; init; } = null!;
        public int LinkedId { get; init; }
    }

    /// <summary>Comprehensive medical summary response for clinical review and exports.</summary>
    public sealed record MedicalSummaryResponse
    {
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public DateOnly? DateOfBirth { get; init; }
        public string? Gender { get; init; }
        public string? BloodType { get; init; }
        
        public string? Allergies { get; init; }
        public string? ChronicConditions { get; init; }
        public string? PastSurgeries { get; init; }
        public string? FamilyHistory { get; init; }
        public string? VaccinationHistory { get; init; }

        public List<PatientVitalsHistoryDto> VitalsHistory { get; set; } = new();
        public List<ActivePrescriptionSummaryDto> ActivePrescriptions { get; set; } = new();
    }

    public sealed record PatientVitalsHistoryDto
    {
        public DateTime Date { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public double? Bmi { get; init; }
    }

    public sealed record ActivePrescriptionSummaryDto
    {
        public int PrescriptionId { get; init; }
        public DateTime Date { get; init; }
        public string DiseaseName { get; init; } = null!;
        public List<string> Medicines { get; init; } = new();
    }
}
