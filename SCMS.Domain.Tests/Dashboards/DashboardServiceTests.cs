using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using SCMS.Domain.Features.Dashboards;
using SCMS.Domain.Features.Dashboards.Models;
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
        var cancelledTodayAppointment = TestData.AddAppointment(db, patient, DateTime.UtcNow.Date.AddHours(11), "cancelled");
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
    public async Task GetDoctorDashboardAsync_WithSpecificMonthAndYear_CalculatesMonthlyWeeklyAndDailyMetricsAccurately()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var activePatient1 = TestData.AddPatient(db, user, "Active Patient 1");
        var activePatient2 = TestData.AddPatient(db, user, "Active Patient 2");
        var cancelledPatient = TestData.AddPatient(db, user, "Cancelled Only Patient");

        // Target Month: March 2026 (Month 3, Year 2026, 31 days)
        // Week 1 (Days 1-7): Day 3 (March 3, 2026) -> Active Patient 1 confirmed + Paid 50,000 MMK
        var appt1 = TestData.AddAppointment(db, activePatient1, new DateTime(2026, 3, 3, 10, 0, 0, DateTimeKind.Utc), "confirmed");
        TestData.AddPayment(db, appt1, status: "paid", amount: 50000m, paidAt: new DateTime(2026, 3, 3, 10, 30, 0, DateTimeKind.Utc));

        // Week 2 (Days 8-14): Day 10 (March 10, 2026) -> Cancelled Patient cancelled + No payment
        var appt2 = TestData.AddAppointment(db, cancelledPatient, new DateTime(2026, 3, 10, 11, 0, 0, DateTimeKind.Utc), "cancelled");

        // Week 3 (Days 15-21): Day 18 (March 18, 2026) -> Active Patient 2 confirmed + Paid 30,000 MMK
        var appt3 = TestData.AddAppointment(db, activePatient2, new DateTime(2026, 3, 18, 14, 0, 0, DateTimeKind.Utc), "confirmed");
        TestData.AddPayment(db, appt3, status: "paid", amount: 30000m, paidAt: new DateTime(2026, 3, 18, 14, 30, 0, DateTimeKind.Utc));

        // Out-of-month appointment: February 2026 -> Should NOT be counted in March metrics
        var febAppt = TestData.AddAppointment(db, activePatient1, new DateTime(2026, 2, 20, 10, 0, 0, DateTimeKind.Utc), "confirmed");
        TestData.AddPayment(db, febAppt, status: "paid", amount: 99000m, paidAt: new DateTime(2026, 2, 20, 10, 0, 0, DateTimeKind.Utc));

        await db.Context.SaveChangesAsync();

        var service = new DashboardService(db.Context);

        var request = new GetDoctorDashboardRequest
        {
            Period = "monthly",
            Month = 3,
            Year = 2026
        };

        var result = await service.GetDoctorDashboardAsync(request);

        Assert.True(result.IsSuccess);
        var data = result.Data!;
        Assert.Equal(3, data.Month);
        Assert.Equal(2026, data.Year);
        Assert.Equal("March 2026", data.MonthName);

        // Monthly Totals
        Assert.Equal(80000m, data.TotalIncome); // 50000 + 30000
        Assert.Equal(3, data.TotalAppointmentsCount); // 3 total made in March
        Assert.Equal(1, data.CancelledAppointmentsCount); // 1 cancelled in March
        Assert.Equal(2, data.TotalPatientsCount); // only activePatient1 and activePatient2; cancelledPatient is excluded

        // Daily Breakdown (31 days in March)
        Assert.Equal(31, data.DailyBreakdown.Count);
        var day3 = data.DailyBreakdown.First(d => d.DayNumber == 3);
        Assert.Equal(50000m, day3.Income);
        Assert.Equal(1, day3.AppointmentsMade);
        Assert.Equal(0, day3.AppointmentsCancelled);
        Assert.Equal(1, day3.TotalPatients);

        var day10 = data.DailyBreakdown.First(d => d.DayNumber == 10);
        Assert.Equal(0m, day10.Income);
        Assert.Equal(1, day10.AppointmentsMade);
        Assert.Equal(1, day10.AppointmentsCancelled);
        Assert.Equal(0, day10.TotalPatients); // cancelled patient excluded

        var day18 = data.DailyBreakdown.First(d => d.DayNumber == 18);
        Assert.Equal(30000m, day18.Income);
        Assert.Equal(1, day18.AppointmentsMade);
        Assert.Equal(1, day18.TotalPatients);

        // Weekly Breakdown (5 weeks in March)
        Assert.Equal(5, data.WeeklyBreakdown.Count);
        var week1 = data.WeeklyBreakdown.First(w => w.WeekNumber == 1);
        Assert.Equal(50000m, week1.Income);
        Assert.Equal(1, week1.AppointmentsMade);
        Assert.Equal(1, week1.TotalPatients);

        var week2 = data.WeeklyBreakdown.First(w => w.WeekNumber == 2);
        Assert.Equal(0m, week2.Income);
        Assert.Equal(1, week2.AppointmentsMade);
        Assert.Equal(1, week2.AppointmentsCancelled);
        Assert.Equal(0, week2.TotalPatients); // cancelled patient excluded

        var week3 = data.WeeklyBreakdown.First(w => w.WeekNumber == 3);
        Assert.Equal(30000m, week3.Income);
        Assert.Equal(1, week3.AppointmentsMade);
        Assert.Equal(1, week3.TotalPatients);
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
