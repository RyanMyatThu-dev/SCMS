using System;

namespace SCMS.Shared.Contracts.Notifications
{
    public class NotificationResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string? ActionRoute { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
