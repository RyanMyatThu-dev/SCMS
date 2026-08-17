using System;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using SCMS.Domain.Features.Dashboards;
using SCMS.Domain.Features.Patients;
using SCMS.Domain.Tests.TestSupport;

namespace SCMS.Domain.Tests.Dashboards;

public class DashboardServiceTests
{
    [Fact]
    public async Task GetDoctorDashboardAsync_ReturnsTodayWorkloadRevenueAndInventoryAlerts()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var todayAppointment = TestData.AddAppointment(db, patient, DateTime.UtcNow.Date.AddHours(9), "confirmed");
        TestData.AddAppointment(db, patient, DateTime.UtcNow.AddDays(1), "pending");
        TestData.AddPayment(db, todayAppointment, status: "paid", amount: 25000m, paidAt: DateTime.UtcNow, paymentMethod: "cash");
        var medicine = TestData.AddMedicine(db, "Low Stock Med");
        TestData.AddBatch(db, medicine, quantity: 5, expiryDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)));
        var service = new DashboardService(db.Context);

        var result = await service.GetDoctorDashboardAsync("daily");

        Assert.True(result.IsSuccess);
        var data = result.Data!;
        Assert.Equal("daily", data.Period);
        Assert.Equal(1, data.TodayAppointmentsCount);
        Assert.Single(data.NextPatients);
        Assert.Equal(25000m, data.TotalIncome);
        Assert.Equal(25000m, data.DailyRevenue);
        Assert.Equal(25000m, data.PaymentBreakdown.CashTotal);
        Assert.Equal(0m, data.PaymentBreakdown.DigitalTotal);
        Assert.Equal(1, data.LowStockAlertsCount);
        Assert.Equal(1, data.ExpiringBatchesCount);
    }

    [Fact]
    public async Task GetDoctorDashboardAsync_WithWeeklyAndMonthlyPeriod_CalculatesWalkInAndFees()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient1 = TestData.AddPatient(db, user, "WalkIn Patient");
        var patient2 = TestData.AddPatient(db, user, "Online Patient");

        var now = DateTime.UtcNow;
        // Same-day appointment (Walk-in)
        var walkInAppt = TestData.AddAppointment(db, patient1, now.Date.AddHours(10), "completed");
        walkInAppt.CreatedAt = now.Date.AddHours(9); // Created today, for today = Walk-in

        // Future-booked appointment (Online)
        var onlineAppt = TestData.AddAppointment(db, patient2, now.Date.AddHours(14), "confirmed");
        onlineAppt.CreatedAt = now.Date.AddDays(-2); // Pre-booked 2 days ago

        TestData.AddPayment(db, walkInAppt, status: "paid", amount: 30000m, paidAt: now, paymentMethod: "online");
        TestData.AddPayment(db, onlineAppt, status: "paid", amount: 15000m, paidAt: now, paymentMethod: "cash");

        await db.Context.SaveChangesAsync();

        var service = new DashboardService(db.Context);

        var result = await service.GetDoctorDashboardAsync("weekly");

        Assert.True(result.IsSuccess);
        var data = result.Data!;
        Assert.Equal("weekly", data.Period);
        Assert.Equal(2, data.TotalAppointmentsCount);
        Assert.Equal(1, data.WalkInPatientsCount);
        Assert.Equal(1, data.OnlineBookingCount);
        Assert.Equal(45000m, data.TotalIncome);
        Assert.Equal(15000m, data.PaymentBreakdown.CashTotal);
        Assert.Equal(30000m, data.PaymentBreakdown.DigitalTotal);
    }

    [Fact]
    public async Task GetPatientDashboardAsync_ReturnsOnlySelectedUsersDashboardData()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var otherUser = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user, "Visible Patient");
        TestData.AddPatient(db, otherUser, "Hidden Patient");
        var appointment = TestData.AddAppointment(db, patient, DateTime.UtcNow.AddDays(1), "pending");
        TestData.AddPayment(db, appointment, status: "pending", amount: 15000m);
        var disease = TestData.AddDisease(db);
        var medicine = TestData.AddMedicine(db);
        var notes = "Dashboard note";
        var prescription = TestData.AddPrescription(db, patient, appointment, disease, notes);
        TestData.AddPrescriptionItem(db, prescription, medicine);
        var service = new DashboardService(db.Context);

        var result = await service.GetPatientDashboardAsync(user.UserId);

        Assert.True(result.IsSuccess);
        var data = result.Data!;
        Assert.Single(data.PatientProfiles);
        Assert.Equal("Visible Patient", data.PatientProfiles[0].Name);
        Assert.Single(data.UpcomingAppointments);
        Assert.Single(data.PrescriptionHistory);
        Assert.Single(data.OutstandingBalances);
    }
}
