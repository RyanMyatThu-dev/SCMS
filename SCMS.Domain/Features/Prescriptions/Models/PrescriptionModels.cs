using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Prescriptions.Models
{
    /// <summary>Request parameters for querying prescriptions with pagination and optional patient filter.</summary>
    public class GetPrescriptionsRequest : PaginationRequest
    {
        public int? PatientId { get; set; }
    }

    /// <summary>Response item for listing prescriptions.</summary>
    public sealed record GetPrescriptionsResponse
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public int? DiseaseId { get; init; }
        public string? DiseaseName { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public string? Notes { get; init; }

        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public double? Bmi { get; init; }
        public string? LabTestRequests { get; init; }

        public List<PrescriptionItemResponseDto> Items { get; init; } = new();
        public List<string> Warnings { get; init; } = new();
        public DateTime CreatedAt { get; init; }
    }

    /// <summary>Response item for detailed prescription information.</summary>
    public sealed record GetPrescriptionDetailsResponse
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public int? DiseaseId { get; init; }
        public string? DiseaseName { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public string? Notes { get; init; }

        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public double? Bmi { get; init; }
        public string? LabTestRequests { get; init; }

        public List<PrescriptionItemResponseDto> Items { get; init; } = new();
        public List<string> Warnings { get; init; } = new();
        public DateTime CreatedAt { get; init; }
    }

    /// <summary>Payload for creating a prescription and dispensing medications.</summary>
    public sealed record CreatePrescriptionRequest
    {
        [Required(ErrorMessage = "Appointment ID is required.")]
        public required int AppointmentId { get; init; }

        [Required(ErrorMessage = "Patient ID is required.")]
        public required int PatientId { get; init; }

        public int? DiseaseId { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public string? Notes { get; init; }

        // Additional Vitals (stored in serialized Notes)
        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public string? LabTestRequests { get; init; }

        public List<PrescriptionItemDto> Items { get; set; } = new();
    }

    /// <summary>Response returned upon creating a prescription.</summary>
    public sealed record CreatePrescriptionResponse
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public int? DiseaseId { get; init; }
        public string? DiseaseName { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public string? Notes { get; init; }

        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public double? Bmi { get; init; }
        public string? LabTestRequests { get; init; }

        public List<PrescriptionItemResponseDto> Items { get; init; } = new();
        public List<string> Warnings { get; init; } = new();
        public DateTime CreatedAt { get; init; }
    }

    /// <summary>Itemized medication line for a prescription.</summary>
    public sealed record PrescriptionItemDto
    {
        [Required]
        public required int MedicineId { get; init; }
        public string? Dosage { get; init; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Days must be greater than zero.")]
        public required int Days { get; init; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
        public required int Quantity { get; init; }

        public string? Instruction { get; init; }

        // Schedule details (maps to TblPrescriptionItemSchedule)
        public string? DoseTime { get; init; }
        public decimal DoseQuantity { get; init; } = 1.0m;
        public string? DoseUnit { get; init; }
        public string? MealTiming { get; init; }
        public string? Route { get; init; }
        public int? IntervalHours { get; init; }
        public int? IntervalDays { get; init; }
        public string? DayOfWeek { get; init; }
        public bool IsAsNeeded { get; init; }
        public string? BodySite { get; init; }
        public string? ScheduleNote { get; init; }
    }

    public sealed record PrescriptionItemResponseDto
    {
        public int Id { get; init; }
        public int MedicineId { get; init; }
        public string MedicineName { get; init; } = null!;
        public int? MedicineBatchId { get; init; }
        public string? BatchNo { get; init; }
        public string? Dosage { get; init; }
        public int Days { get; init; }
        public int Quantity { get; init; }
        public string? Instruction { get; init; }

        public string? DoseTime { get; init; }
        public decimal DoseQuantity { get; init; }
        public string? DoseUnit { get; init; }
        public string? MealTiming { get; init; }
        public string? Route { get; init; }
        public int? IntervalHours { get; init; }
        public int? IntervalDays { get; init; }
        public string? DayOfWeek { get; init; }
        public bool IsAsNeeded { get; init; }
        public string? BodySite { get; init; }
        public string? ScheduleNote { get; init; }
    }

    /// <summary>Request parameters for listing prescription templates with pagination.</summary>
    public class GetTemplatesRequest : PaginationRequest
    {
        public int? DiseaseId { get; set; }
    }

    /// <summary>Response item for prescription template listing.</summary>
    public sealed record GetTemplatesResponse
    {
        public string Id { get; init; } = null!;
        public string Name { get; init; } = null!;
        public int DiseaseId { get; init; }
        public string DiseaseName { get; init; } = null!;
        public List<TemplateItemResponseDto> Items { get; init; } = new();
    }

    /// <summary>Payload for creating or updating a standard prescription medication template.</summary>
    public sealed record SaveTemplateRequest
    {
        public int? Id { get; init; }

        [Required(ErrorMessage = "Template name is required.")]
        public required string Name { get; init; }

        [Required(ErrorMessage = "Disease ID is required.")]
        public required int DiseaseId { get; init; }

        public List<TemplateItemDto> Items { get; init; } = new();
    }

    /// <summary>Response returned upon saving a prescription template.</summary>
    public sealed record SaveTemplateResponse
    {
        public string Id { get; init; } = null!;
        public string Name { get; init; } = null!;
        public int DiseaseId { get; init; }
        public string DiseaseName { get; init; } = null!;
        public List<TemplateItemResponseDto> Items { get; init; } = new();
    }

    public sealed record TemplateItemDto
    {
        public int MedicineId { get; init; }
        public string? Dosage { get; init; }
        public int Days { get; init; }
        public int Quantity { get; init; }
        public string? Instruction { get; init; }
    }

    public sealed record TemplateItemResponseDto
    {
        public int MedicineId { get; init; }
        public string MedicineName { get; init; } = null!;
        public string? Dosage { get; init; }
        public int Days { get; init; }
        public int Quantity { get; init; }
        public string? Instruction { get; init; }
    }

    // Backward-compatibility records
    public sealed record PrescriptionResponse
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public int? DiseaseId { get; init; }
        public string? DiseaseName { get; init; }
        public double? WeightKg { get; init; }
        public int? BloodPressureSystolic { get; init; }
        public int? BloodPressureDiastolic { get; init; }
        public string? Notes { get; init; }

        public double? TemperatureC { get; init; }
        public int? PulseBpm { get; init; }
        public int? Spo2Percent { get; init; }
        public double? HeightCm { get; init; }
        public double? Bmi { get; init; }
        public string? LabTestRequests { get; init; }

        public List<PrescriptionItemResponseDto> Items { get; init; } = new();
        public List<string> Warnings { get; init; } = new();
        public DateTime CreatedAt { get; init; }
    }

    public sealed record PrescriptionTemplateResponse
    {
        public string Id { get; init; } = null!;
        public string Name { get; init; } = null!;
        public int DiseaseId { get; init; }
        public string DiseaseName { get; init; } = null!;
        public List<TemplateItemResponseDto> Items { get; init; } = new();
    }
}
