using SCMS.Domain.Features.Documents.Models;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Domain.Features.Payments.Models;
using SCMS.Domain.Features.Prescriptions.Models;

namespace SCMS.Domain.Features.Documents
{
    public interface IPdfDocumentService
    {
        byte[] CreateMedicalSummaryPdf(string title, string html);
        byte[] CreateMedicalSummaryPdf(MedicalSummaryResponse s);
        byte[] CreatePrescriptionPdf(PrescriptionResponse rx);
        byte[] CreatePrescriptionReportPdf(PrescriptionReportResponse report);
        byte[] CreateInvoicePdf(PaymentDetailsResponse payment);
        byte[] CreateAppointmentReportPdf(AppointmentReportResponse report);
        byte[] CreateRevenueReportPdf(RevenueReportResponse report);
        byte[] CreatePatientListReportPdf(PatientListReportResponse report);
        byte[] CreateMedicineStockReportPdf(MedicineStockReportResponse report);
        byte[] CreateFollowUpReportPdf(FollowUpReportResponse report);
        byte[] CreateBusinessSummaryReportPdf(BusinessSummaryReportResponse report);
    }
}
