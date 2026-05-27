using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Shared;

namespace SCMS.Domain.Features.Notifications
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly NotificationService _notificationService;

        public NotificationsController(NotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int GetUserId()
        {
            if (Request.Headers.TryGetValue("X-User-Id", out var headerValue) && int.TryParse(headerValue, out var headerUserId))
            {
                return headerUserId;
            }
            if (Request.Query.TryGetValue("userId", out var queryValue) && int.TryParse(queryValue, out var queryUserId))
            {
                return queryUserId;
            }
            return 1; // Demo fallback
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] PaginationRequest paginationRequest, [FromQuery] bool includeAll = false)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            int? userId = includeAll ? null : GetUserId();

            var result = await _notificationService.GetNotificationsAsync(userId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var result = await _notificationService.MarkAsReadAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationApiRequest request)
        {
            var result = await _notificationService.CreateNotificationAsync(request.UserId, request.Title, request.Description, request.ActionRoute);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }

    public class CreateNotificationApiRequest
    {
        public int? UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ActionRoute { get; set; }
    }
}
