using System;
using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.Features.FollowUps.Models
{
    /// <summary>Payload for scheduling a patient follow-up consultation.</summary>
    public sealed record FollowUpRequest
    {
        [Required(ErrorMessage = "Patient ID is required.")]
        public required int PatientId { get; init; }

        public int? AppointmentId { get; init; }

        public int? PrescriptionId { get; init; }

        [Required(ErrorMessage = "Due date is required.")]
        public required DateTime DueAt { get; init; }

        [Required(ErrorMessage = "Recommendation is required.")]
        public required string Recommendation { get; init; }
    }

    /// <summary>Scheduled follow-up consultation response.</summary>
    public sealed record FollowUpResponse
    {
        public int Id { get; init; }
        public int PatientId { get; init; }
        public string PatientName { get; init; } = null!;
        public int? AppointmentId { get; init; }
        public int? PrescriptionId { get; init; }
        public DateTime DueAt { get; init; }
        public string Recommendation { get; init; } = null!;
        public string Status { get; init; } = null!;
        public DateTime CreatedAt { get; init; }
        public DateTime? CompletedAt { get; init; }
    }
}
