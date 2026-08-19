using System;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Notifications.Models
{
    /// <summary>Request parameters for listing notifications with pagination.</summary>
    public class GetNotificationsRequest : PaginationRequest
    {
        public bool IncludeAll { get; set; } = false;
    }

    /// <summary>Response item for listing notifications.</summary>
    public sealed record GetNotificationsResponse
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

    /// <summary>Response returned upon creating a new notification.</summary>
    public sealed record CreateNotificationResponse
    {
        public int Id { get; init; }
        public string Title { get; init; } = null!;
        public string? Description { get; init; }
        public string? ActionRoute { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    // Backward-compatibility record
    public sealed record NotificationResponse
    {
        public int Id { get; init; }
        public string Title { get; init; } = null!;
        public string? Description { get; init; }
        public string? ActionRoute { get; init; }
        public DateTime CreatedAt { get; init; }
    }
}
