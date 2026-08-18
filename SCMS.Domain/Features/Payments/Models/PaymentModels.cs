using System;
using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.Features.Payments.Models
{
    /// <summary>Payload for processing payment gateway webhook callback.</summary>
    public sealed record ProcessPaymentCallbackRequest
    {
        [Required]
        public required int AppointmentId { get; init; }

        [Required]
        public required string PaymentMethod { get; init; } // card / kbzpay / wavepay

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than zero.")]
        public required decimal Amount { get; init; }

        public string? GatewayTransactionId { get; init; }
        public bool IsSuccess { get; init; }
    }

    /// <summary>Payload for submitting manual payment proof screenshot.</summary>
    public sealed record ManualPaymentProofRequest
    {
        [Required]
        public required int AppointmentId { get; init; }

        [Required]
        public required string PaymentMethod { get; init; } // kbzpay / wavepay

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than zero.")]
        public required decimal Amount { get; init; }

        [Required]
        public required string ScreenshotUrl { get; init; }
    }

    /// <summary>Payment and billing transaction details response.</summary>
    public sealed record PaymentDetailsResponse
    {
        public int Id { get; init; }
        public int AppointmentId { get; init; }
        public string AppointmentCode { get; init; } = null!;
        public string PatientName { get; init; } = null!;
        public decimal Amount { get; init; }
        public decimal Tax { get; init; }
        public decimal Charges { get; init; }
        public string PaymentMethod { get; init; } = null!;
        public string PaymentStatus { get; init; } = null!;
        public string? PaymentScreenshot { get; init; }
        public DateTime? PaidAt { get; init; }
    }
}
