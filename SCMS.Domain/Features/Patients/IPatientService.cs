using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Patients.Models;

namespace SCMS.Domain.Features.Patients
{
    public interface IPatientService
    {
        Task<Result<CreatePatientProfileResponse>> AddPatientProfileAsync(CreatePatientProfileRequest request, int userId);
        Task<PagedResult<GetPatientProfilesResponse>> GetPatientProfilesAsync(GetPatientProfilesRequest request, int userId, bool isStaff = false);
        Task<PagedResult<SearchPatientProfilesResponse>> SearchPatientProfilesAsync(SearchPatientProfilesRequest request, int userId, bool isStaff = false);
        Task<Result> DeletePatientProfileAsync(int id, int userId);
        Task<Result<GetPatientProfileByIdResponse>> GetPatientProfileByIdAsync(int id, int userId);
        Task<Result<PatientHistoryResponse>> GetPatientHistoryAsync(int patientId, int userId);
        Task<Result<MedicalSummaryResponse>> GetMedicalSummaryAsync(int patientId, int userId);
        Task<string> GenerateMedicalSummaryHtmlAsync(int patientId, int userId);
    }
}
