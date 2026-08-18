using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Notifications.Models;

namespace SCMS.Domain.Features.Notifications
{
    public interface INotificationService
    {
        Task<PagedResult<NotificationResponse>> GetNotificationsAsync(int? userId, PaginationRequest paginationRequest, bool isStaff = false);
        Task<Result> MarkAsReadAsync(int notificationId, int userId);
        Task<Result<NotificationResponse>> CreateNotificationAsync(int? userId, string title, string description, string? actionRoute);
        Task<int> CleanupSoftDeletedNotificationsAsync(int daysOld = 30);
    }
}
