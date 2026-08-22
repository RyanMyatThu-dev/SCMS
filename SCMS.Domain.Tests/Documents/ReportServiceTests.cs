using System;
using System.Linq;
using System.Threading.Tasks;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Documents.Models;
using SCMS.Domain.Tests.TestSupport;
using Xunit;

namespace SCMS.Domain.Tests.Documents;

public class ReportServiceTests
{
    [Fact]
    public async Task GetAppointmentReportAsync_WeeklyWithStartDate_SetsOneWeekSpan()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var startDate = new DateTime(2026, 8, 10);
        var inRangeAppt = TestData.AddAppointment(db, patient, status: "completed");
        inRangeAppt.Datetime = new DateTime(2026, 8, 12, 10, 0, 0);

        var outOfRangeAppt = TestData.AddAppointment(db, patient, status: "completed");
        outOfRangeAppt.Datetime = new DateTime(2026, 8, 20, 10, 0, 0);
        await db.Context.SaveChangesAsync();

        var service = new ReportService(db.Context);
        var result = await service.GetAppointmentReportAsync(new AppointmentReportRequest
        {
            ReportType = "weekly",
            StartDate = startDate,
            EndDate = startDate.AddDays(6)
        });

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(new DateTime(2026, 8, 10), result.Data.PeriodStart);
        Assert.Equal(new DateTime(2026, 8, 16), result.Data.PeriodEnd);
        Assert.Equal(1, result.Data.TotalAppointments);
    }

    [Fact]
    public async Task GetRevenueReportAsync_CustomDateRange_FiltersCorrectly()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var appt1 = TestData.AddAppointment(db, patient);
        var pay1 = TestData.AddPayment(db, appt1, amount: 25000m, status: "paid");
        pay1.PaidAt = new DateTime(2026, 8, 5, 14, 0, 0);

        var appt2 = TestData.AddAppointment(db, patient);
        var pay2 = TestData.AddPayment(db, appt2, amount: 15000m, status: "paid");
        pay2.PaidAt = new DateTime(2026, 8, 25, 14, 0, 0);
        await db.Context.SaveChangesAsync();

        var service = new ReportService(db.Context);
        var result = await service.GetRevenueReportAsync(new RevenueReportRequest
        {
            ReportType = "custom",
            StartDate = new DateTime(2026, 8, 1),
            EndDate = new DateTime(2026, 8, 10)
        });

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(1, result.Data.TotalTransactions);
        Assert.Equal(25000m, result.Data.TotalAmount);
    }

    [Fact]
    public async Task GetRevenueReportAsync_MonthlyWithMonthAndYear_FiltersCorrectMonth()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var appt1 = TestData.AddAppointment(db, patient);
        var pay1 = TestData.AddPayment(db, appt1, amount: 30000m, status: "paid");
        pay1.PaidAt = new DateTime(2026, 9, 15, 10, 0, 0);
        await db.Context.SaveChangesAsync();

        var service = new ReportService(db.Context);
        var result = await service.GetRevenueReportAsync(new RevenueReportRequest
        {
            ReportType = "monthly",
            Month = 9,
            Year = 2026
        });

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        Assert.Equal(new DateTime(2026, 9, 1), result.Data.PeriodStart);
        Assert.Equal(1, result.Data.TotalTransactions);
        Assert.Equal(30000m, result.Data.TotalAmount);
    }
}
