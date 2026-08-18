using System;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Appointments.Models
{
    /// <summary>
    /// Payload for booking a new appointment.
    /// </summary>
    public sealed record BookAppointmentRequest
    {
        [Required(ErrorMessage = "Patient ID is required.")]
        public required int PatientId { get; init; }

        [Required(ErrorMessage = "Appointment datetime is required.")]
        public required DateTime Datetime { get; init; }

        public string? Notes { get; init; }
    }

    /// <summary>
    /// Response returned upon booking a new appointment.
    /// </summary>
    public sealed record BookAppointmentResponse
    {
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int TokenNumber { get; init; }
        public int EstimatedWaitTimeMinutes { get; init; }
        public string Status { get; init; } = null!;
    }

    /// <summary>
    /// Payload for updating an appointment's status.
    /// </summary>
    public sealed record UpdateAppointmentStatusRequest
    {
        [Required(ErrorMessage = "Status is required.")]
        public required string Status { get; init; } // pending / confirmed / cancelled / completed

        public string? Notes { get; init; }
    }

    /// <summary>
    /// Payload for rescheduling an appointment.
    /// </summary>
    public sealed record RescheduleAppointmentRequest
    {
        [Required(ErrorMessage = "New datetime is required.")]
        public required DateTime NewDatetime { get; init; }

        public string? Notes { get; init; }
    }

    /// <summary>
    /// Full appointment details response.
    /// </summary>
    public sealed record AppointmentDetailsResponse
    {
        public int Id { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public DateTime Datetime { get; init; }
        public string Status { get; init; } = null!;
        public string? Notes { get; init; }
        public int TokenNumber { get; init; }
        public string ClinicDoctorName { get; init; } = "Clinic Doctor";
        public DateTime CreatedAt { get; init; }
    }

    /// <summary>
    /// Real-time queue status response for a patient's appointment.
    /// </summary>
    public sealed record AppointmentQueueStatusResponse
    {
        public int PatientTokenNumber { get; init; }
        public int CurrentActiveTokenNumber { get; init; }
        public int PatientsAhead { get; init; }
        public string QueueMessage { get; init; } = null!;
        public int EstimatedWaitTimeMinutes { get; init; }
        public string DoctorStatus { get; init; } = null!; // In Consultation / Available / Out of Office
        public double ProgressBarPercentage { get; init; }
        public bool IsYourTurn { get; init; }
    }
}
