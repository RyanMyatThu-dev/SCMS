namespace SCMS.Shared.Contracts.Notifications
{
    public class CreateNotificationRequest
    {
        public int? UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ActionRoute { get; set; }
    }
}
