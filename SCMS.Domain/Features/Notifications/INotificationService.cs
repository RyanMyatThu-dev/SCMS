using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Notifications.Models;

namespace SCMS.Domain.Features.Notifications
{
    public interface INotificationService
    {
        Task<PagedResult<GetNotificationsResponse>> GetNotificationsAsync(GetNotificationsRequest request, int? userId, bool isStaff = false);
        Task<Result> MarkAsReadAsync(int notificationId, int userId);
        Task<Result<CreateNotificationResponse>> CreateNotificationAsync(CreateNotificationRequest request);
        Task<Result<NotificationResponse>> CreateNotificationAsync(int? userId, string title, string description, string? actionRoute);
        Task<int> CleanupSoftDeletedNotificationsAsync(int daysOld = 30);
    }
}
