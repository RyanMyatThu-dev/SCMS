using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Documents.Models;

namespace SCMS.Domain.Features.Documents
{
    public interface IReportService
    {
        Task<Result<AppointmentReportResponse>> GetAppointmentReportAsync(AppointmentReportRequest request);
        Task<Result<RevenueReportResponse>> GetRevenueReportAsync(RevenueReportRequest request);
        Task<Result<PatientListReportResponse>> GetPatientListReportAsync();
        Task<Result<MedicineStockReportResponse>> GetMedicineStockReportAsync();
        Task<Result<FollowUpReportResponse>> GetFollowUpReportAsync(FollowUpReportRequest request);
        Task<Result<BusinessSummaryReportResponse>> GetBusinessSummaryReportAsync(BusinessSummaryReportRequest request);
        Task<Result<PrescriptionReportResponse>> GetPrescriptionReportAsync();
    }
}
