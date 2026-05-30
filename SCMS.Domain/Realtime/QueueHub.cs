using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SCMS.Domain.Realtime
{
    [Authorize]
    public class QueueHub : Hub
    {
        public Task WatchAppointment(int appointmentId)
            => Groups.AddToGroupAsync(Context.ConnectionId, $"appointment-{appointmentId}");

        public Task WatchClinicQueue()
            => Groups.AddToGroupAsync(Context.ConnectionId, "clinic-queue");
    }
}
