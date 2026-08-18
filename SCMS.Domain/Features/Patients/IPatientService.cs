using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Patients.Models;

namespace SCMS.Domain.Features.Patients
{
    public interface IPatientService
    {
        Task<Result<PatientProfileResponse>> AddPatientProfileAsync(PatientProfileRequest request, int userId);
        Task<PagedResult<PatientProfileResponse>> GetPatientProfilesAsync(PatientProfilesRequest request, int userId, bool isStaff = false);
        Task<Result> DeletePatientProfileAsync(int id, int userId);
        Task<Result<PatientProfileResponse>> GetPatientProfileByIdAsync(int id, int userId);
        Task<Result<PatientHistoryResponse>> GetPatientHistoryAsync(int patientId, int userId);
        Task<Result<MedicalSummaryResponse>> GetMedicalSummaryAsync(int patientId, int userId);
        Task<string> GenerateMedicalSummaryHtmlAsync(int patientId, int userId);
    }
}
