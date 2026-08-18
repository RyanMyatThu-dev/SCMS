using System;
using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.Features.Notifications.Models
{
    /// <summary>Notification detail response.</summary>
    public sealed record NotificationResponse
    {
        public int Id { get; init; }
        public string Title { get; init; } = null!;
        public string? Description { get; init; }
        public string? ActionRoute { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    /// <summary>Payload for creating and dispatching a new notification.</summary>
    public sealed record CreateNotificationRequest
    {
        public int? UserId { get; init; }

        [Required(ErrorMessage = "Notification title is required.")]
        public required string Title { get; init; }

        [Required(ErrorMessage = "Notification description is required.")]
        public required string Description { get; init; }

        public string? ActionRoute { get; init; }
    }
}
