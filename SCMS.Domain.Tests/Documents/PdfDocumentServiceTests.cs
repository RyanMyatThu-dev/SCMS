using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Payments.Models;
using SCMS.Domain.Features.Prescriptions.Models;

namespace SCMS.Domain.Tests.Documents;

public class PdfDocumentServiceTests
{
    [Fact]
    public void PdfMethods_ReturnNonEmptyPdfFiles()
    {
        var service = new PdfDocumentService();

        var summary = service.CreateMedicalSummaryPdf("Summary", "<h1>Patient Summary</h1><p>Stable.</p>");
        var prescription = service.CreatePrescriptionPdf(new PrescriptionResponse
        {
            Id = 12,
            AppointmentCode = "APT-12",
            PatientName = "Patient",
            Items =
            {
                new PrescriptionItemResponseDto
                {
                    MedicineName = "Paracetamol",
                    Dosage = "500mg",
                    Quantity = 6,
                    Days = 3,
                    Instruction = "After meal"
                }
            }
        });
        var invoice = service.CreateInvoicePdf(new PaymentDetailsResponse
        {
            Id = 7,
            AppointmentCode = "APT-7",
            PatientName = "Patient",
            Amount = 1000m,
            Tax = 50m,
            Charges = 0m,
            PaymentMethod = "manual",
            PaymentStatus = "paid"
        });
        var apptReport = service.CreateAppointmentReportPdf(new SCMS.Domain.Features.Documents.Models.AppointmentReportResponse
        {
            ReportTitle = "Custom Appointment Report",
            ReportType = "custom",
            PeriodStart = DateTime.UtcNow.Date,
            PeriodEnd = DateTime.UtcNow.Date.AddDays(10),
            GeneratedAt = DateTime.UtcNow,
            TotalAppointments = 1,
            CompletedCount = 1,
            Items =
            {
                new SCMS.Domain.Features.Documents.Models.AppointmentReportItemDto
                {
                    AppointmentId = 1,
                    AppointmentCode = "APT-1",
                    PatientName = "Patient One",
                    Datetime = DateTime.UtcNow,
                    Status = "completed"
                }
            }
        });
        var revReport = service.CreateRevenueReportPdf(new SCMS.Domain.Features.Documents.Models.RevenueReportResponse
        {
            ReportTitle = "Monthly Revenue Report",
            ReportType = "monthly",
            PeriodStart = new DateTime(2026, 8, 1),
            PeriodEnd = new DateTime(2026, 8, 31),
            GeneratedAt = DateTime.UtcNow,
            TotalTransactions = 1,
            TotalAmount = 5000m,
            GrandTotal = 5000m
        });

        AssertPdf(summary);
        AssertPdf(prescription);
        AssertPdf(invoice);
        AssertPdf(apptReport);
        AssertPdf(revReport);
    }

    private static void AssertPdf(byte[] bytes)
    {
        Assert.True(bytes.Length > 100);
        Assert.Equal("%PDF", System.Text.Encoding.ASCII.GetString(bytes, 0, 4));
    }
}
