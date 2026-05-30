using Microsoft.AspNetCore.SignalR.Client;
using SCMS.Shared.Contracts.Notifications;

namespace SCMS.Web.Services
{
    public class RealtimeClient : IAsyncDisposable
    {
        private readonly TokenStore _tokenStore;
        private HubConnection? _queueConnection;
        private HubConnection? _notificationConnection;
        public event Action? NotificationsChanged;
        public event Action<NotificationResponse>? OnNotificationReceived;

        public RealtimeClient(TokenStore tokenStore)
        {
            _tokenStore = tokenStore;
        }

        public async Task StartQueueAsync(string apiBaseAddress)
        {
            _queueConnection ??= new HubConnectionBuilder()
                .WithUrl($"{apiBaseAddress.TrimEnd('/')}/hubs/queue", options =>
                {
                    options.AccessTokenProvider = async () => await _tokenStore.GetAccessTokenAsync();
                })
                .WithAutomaticReconnect()
                .Build();

            if (_queueConnection.State == HubConnectionState.Disconnected)
            {
                await _queueConnection.StartAsync();
                await _queueConnection.SendAsync("WatchClinicQueue");
            }
        }

        public async Task StartNotificationsAsync(string apiBaseAddress)
        {
            _notificationConnection ??= new HubConnectionBuilder()
                .WithUrl($"{apiBaseAddress.TrimEnd('/')}/hubs/notifications", options =>
                {
                    options.AccessTokenProvider = async () => await _tokenStore.GetAccessTokenAsync();
                })
                .WithAutomaticReconnect()
                .Build();

            _notificationConnection.On("NotificationsChanged", () => NotificationsChanged?.Invoke());
            _notificationConnection.On<NotificationResponse>("ReceiveNotification", n => OnNotificationReceived?.Invoke(n));

            if (_notificationConnection.State == HubConnectionState.Disconnected)
            {
                await _notificationConnection.StartAsync();
                await _notificationConnection.SendAsync("WatchNotifications");
            }
        }

        public async Task StopNotificationsAsync()
        {
            if (_notificationConnection != null && _notificationConnection.State != HubConnectionState.Disconnected)
            {
                await _notificationConnection.StopAsync();
            }
        }

        public async ValueTask DisposeAsync()
        {
            if (_queueConnection != null)
            {
                await _queueConnection.DisposeAsync();
            }
            if (_notificationConnection != null)
            {
                await _notificationConnection.DisposeAsync();
            }
        }
    }
}
