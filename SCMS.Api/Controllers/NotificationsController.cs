using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Notifications;
using SCMS.Domain.Features.Notifications.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>Query notifications for the current user or clinic-wide broadcasts.</summary>
        [HttpGet]
        [HasPermission("Notifications.View")]
        [ProducesResponseType(typeof(PagedResult<GetNotificationsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetNotifications([FromQuery] GetNotificationsRequest request)
        {
            request ??= new GetNotificationsRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var currentUserId = User.GetUserId();
            if (!request.IncludeAll && !currentUserId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            int? userId = request.IncludeAll && User.IsStaff() ? null : currentUserId;

            var result = await _notificationService.GetNotificationsAsync(request, userId, User.IsStaff());
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Mark a notification as read / dismissed.</summary>
        [HttpPost("{id:int}/read")]
        [HasPermission("Notifications.Update")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _notificationService.MarkAsReadAsync(id, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Create and send a notification to a specific user or broadcast to clinic staff.</summary>
        [HttpPost]
        [HasPermission("Notifications.Create")]
        [ProducesResponseType(typeof(Result<CreateNotificationResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            var result = await _notificationService.CreateNotificationAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }
    }
}
