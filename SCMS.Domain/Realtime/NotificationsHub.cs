using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SCMS.Domain.Realtime
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            if (Context.User?.IsInRole("owner") == true
                || Context.User?.IsInRole("admin") == true
                || Context.User?.IsInRole("doctor") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "clinic-notifications");
            }
            await base.OnConnectedAsync();
        }

        public Task WatchBroadcasts()
        {
            if (Context.User?.IsInRole("owner") == true
                || Context.User?.IsInRole("admin") == true
                || Context.User?.IsInRole("doctor") == true)
            {
                return Groups.AddToGroupAsync(Context.ConnectionId, "clinic-notifications");
            }
            return Task.CompletedTask;
        }

        public Task WatchNotifications()
        {
            if (Context.User?.IsInRole("owner") == true
                || Context.User?.IsInRole("admin") == true
                || Context.User?.IsInRole("doctor") == true)
            {
                return Groups.AddToGroupAsync(Context.ConnectionId, "clinic-notifications");
            }
            return Task.CompletedTask;
        }
    }
}
