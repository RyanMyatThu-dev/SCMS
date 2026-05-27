using Microsoft.EntityFrameworkCore;
using SCMS.Domain.Features.Medicines;
using SCMS.Domain.Tests.TestSupport;
using SCMS.Shared;

namespace SCMS.Domain.Tests.Medicines;

public class MedicineServiceTests
{
    [Fact]
    public async Task SearchMedicinesAsync_ReturnsOnlyUsableActiveBatches()
    {
        using var db = new TestDatabase();
        var medicine = TestData.AddMedicine(db, "Paracetamol");
        TestData.AddBatch(db, medicine, quantity: 10, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20)), batchNo: "ACTIVE-1");
        TestData.AddBatch(db, medicine, quantity: 7, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)), batchNo: "EXPIRED-1");
        TestData.AddBatch(db, medicine, quantity: 5, status: "disposed", batchNo: "DISPOSED-1");
        var service = new MedicineService(db.Context);

        var result = await service.SearchMedicinesAsync("para", new PaginationRequest());

        Assert.True(result.IsSuccess);
        var item = Assert.Single(result.Data);
        Assert.Equal(10, item.TotalStock);
        Assert.Single(item.ActiveBatches);
        Assert.Equal("ACTIVE-1", item.ActiveBatches[0].BatchNo);
        Assert.True(item.HasLowStockWarning);
        Assert.True(item.HasNearExpiryWarning);
    }

    [Fact]
    public async Task QuarantineExpiredBatchesAsync_UpdatesOnlyExpiredActiveBatches()
    {
        using var db = new TestDatabase();
        var medicine = TestData.AddMedicine(db);
        var expiredActive = TestData.AddBatch(db, medicine, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)), status: "active");
        var futureActive = TestData.AddBatch(db, medicine, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)), status: "active");
        var service = new MedicineService(db.Context);

        var result = await service.QuarantineExpiredBatchesAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal("expired", (await db.Context.TblMedicineBatches.FindAsync(expiredActive.Id))!.Status);
        Assert.Equal("active", (await db.Context.TblMedicineBatches.FindAsync(futureActive.Id))!.Status);
    }

    [Fact]
    public async Task GetInventoryAlertsAsync_ReturnsLowStockAndNearExpiryButNotExpired()
    {
        using var db = new TestDatabase();
        var medicine = TestData.AddMedicine(db, "Amoxicillin");
        TestData.AddBatch(db, medicine, quantity: 5, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)), batchNo: "NEAR");
        TestData.AddBatch(db, medicine, quantity: 2, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-5)), batchNo: "OLD");
        var service = new MedicineService(db.Context);

        var result = await service.GetInventoryAlertsAsync(new PaginationRequest());

        Assert.True(result.IsSuccess);
        Assert.Contains(result.Data, x => x.AlertType == "Low Stock" && x.CurrentQuantity == 5);
        Assert.Contains(result.Data, x => x.AlertType == "Nearing Expiry" && x.BatchNo == "NEAR");
        Assert.DoesNotContain(result.Data, x => x.BatchNo == "OLD");
    }

    [Fact]
    public async Task CreateInventoryAlertNotificationsAsync_CreatesAndDeduplicatesAlerts()
    {
        using var db = new TestDatabase();
        var medicine = TestData.AddMedicine(db, "Cefixime");
        TestData.AddBatch(db, medicine, quantity: 4, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), batchNo: "ALERT");
        var service = new MedicineService(db.Context);

        await service.CreateInventoryAlertNotificationsAsync();
        await service.CreateInventoryAlertNotificationsAsync();

        Assert.Equal(1, await db.Context.TblNotifications.CountAsync(n => n.Title == "Low Stock Alert"));
        Assert.Equal(1, await db.Context.TblNotifications.CountAsync(n => n.Title == "Batch Nearing Expiry"));
    }
}
