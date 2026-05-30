using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SCMS.Domain.Features.Medicines
{
    public class InventoryMonitorService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<InventoryMonitorService> _logger;

        public InventoryMonitorService(IServiceScopeFactory scopeFactory, ILogger<InventoryMonitorService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var medicineService = scope.ServiceProvider.GetRequiredService<MedicineService>();
                    await medicineService.QuarantineExpiredBatchesAsync();
                    await medicineService.CreateInventoryAlertNotificationsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Inventory monitor pass failed.");
                }

                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
        }
    }
}
