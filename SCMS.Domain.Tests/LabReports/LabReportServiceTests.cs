using Microsoft.EntityFrameworkCore;
using SCMS.Domain.Features.LabReports;
using SCMS.Domain.Tests.TestSupport;
using SCMS.Shared;
using SCMS.Shared.Contracts.LabReports;

namespace SCMS.Domain.Tests.LabReports;

public class LabReportServiceTests
{
    [Fact]
    public async Task CreateLabReportAsync_AddsRequestAndPatientNotification()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var appointment = TestData.AddAppointment(db, patient);
        var service = new LabReportService(db.Context);

        var result = await service.CreateLabReportAsync(new LabReportRequest
        {
            PatientId = patient.PatientId,
            AppointmentId = appointment.Id,
            TestName = "CBC",
            Notes = "Before follow-up"
        });

        Assert.True(result.IsSuccess);
        Assert.Equal("requested", result.Data!.Status);
        Assert.True(await db.Context.TblLabReports.AnyAsync(l => l.PatientId == patient.PatientId && l.TestName == "CBC"));
        Assert.True(await db.Context.TblNotifications.AnyAsync(n => n.UserId == user.UserId && n.Title == "Lab Test Requested"));
    }

    [Fact]
    public async Task AddResultAsync_CompletesReportAndCreatesReadyNotification()
    {
        using var db = new TestDatabase();
        var user = TestData.AddUser(db);
        var patient = TestData.AddPatient(db, user);
        var service = new LabReportService(db.Context);
        var requested = await service.CreateLabReportAsync(new LabReportRequest
        {
            PatientId = patient.PatientId,
            TestName = "Lipid panel"
        });

        var result = await service.AddResultAsync(requested.Data!.Id, new LabReportResultRequest
        {
            ResultSummary = "Within reference range",
            AttachmentUrl = "lipid.pdf"
        });

        Assert.True(result.IsSuccess);
        Assert.Equal("completed", result.Data!.Status);
        Assert.Equal("Within reference range", result.Data.ResultSummary);
        Assert.True(await db.Context.TblNotifications.AnyAsync(n => n.UserId == user.UserId && n.Title == "Lab Report Ready"));
    }

    [Fact]
    public async Task GetLabReportsAsync_RestrictsPatientsToOwnedReports()
    {
        using var db = new TestDatabase();
        var owner = TestData.AddUser(db);
        var otherUser = TestData.AddUser(db);
        var ownerPatient = TestData.AddPatient(db, owner, "Owner");
        var otherPatient = TestData.AddPatient(db, otherUser, "Other");
        var service = new LabReportService(db.Context);
        await service.CreateLabReportAsync(new LabReportRequest { PatientId = ownerPatient.PatientId, TestName = "Owned" });
        await service.CreateLabReportAsync(new LabReportRequest { PatientId = otherPatient.PatientId, TestName = "Hidden" });

        var result = await service.GetLabReportsAsync(null, owner.UserId, false, new PaginationRequest());

        Assert.True(result.IsSuccess);
        var report = Assert.Single(result.Data);
        Assert.Equal("Owned", report.TestName);
    }
}
