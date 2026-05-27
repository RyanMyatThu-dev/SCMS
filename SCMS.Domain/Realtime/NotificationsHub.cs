using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SCMS.Domain.Realtime
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        public Task WatchBroadcasts()
            => Groups.AddToGroupAsync(Context.ConnectionId, "clinic-notifications");
    }
}
