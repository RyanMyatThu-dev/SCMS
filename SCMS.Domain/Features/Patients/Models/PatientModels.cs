using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Patients.Models
{
    /// <summary>Request parameters for listing patient profiles with pagination.</summary>
    public class GetPatientProfilesRequest : PaginationRequest
    {
    }

    /// <summary>Response item for listing patient profiles.</summary>
    public sealed record GetPatientProfilesResponse
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

    /// <summary>Request parameters for searching patient profiles by keyword.</summary>
    public class SearchPatientProfilesRequest : PaginationRequest
    {
        [Required(ErrorMessage = "Search query is required.")]
        public string Query { get; set; } = string.Empty;
    }

    /// <summary>Response item for searching patient profiles.</summary>
    public sealed record SearchPatientProfilesResponse
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

    /// <summary>Payload for creating a patient profile.</summary>
    public sealed record CreatePatientProfileRequest
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

    /// <summary>Response returned upon creating a patient profile.</summary>
    public sealed record CreatePatientProfileResponse
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

    /// <summary>Detailed patient profile response.</summary>
    public sealed record GetPatientProfileByIdResponse
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

    // Backward-compatibility models
    public class PatientProfilesRequest : PaginationRequest
    {
        public string? Search { get; set; }
    }

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
