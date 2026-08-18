using System.Threading.Tasks;

namespace SCMS.Domain.Features.Documents
{
    public interface IPdfDocumentService
    {
        Task<byte[]> GeneratePatientHistoryPdfAsync(int patientId);
        Task<byte[]> GeneratePrescriptionPdfAsync(int prescriptionId);
        Task<byte[]> GeneratePaymentInvoicePdfAsync(int paymentId);
        Task<byte[]> GenerateMonthlyReportPdfAsync(int year, int month);
        Task<byte[]> GenerateWeeklyReportPdfAsync(int year, int week);
    }
}
