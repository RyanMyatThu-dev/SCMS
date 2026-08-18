using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Patients;

namespace SCMS.Domain.Features.Patients
{
    public interface IPatientService
    {
        Task<Result<IEnumerable<PatientResponse>>> GetAllAsync(string? search, int currentUserId, bool isStaff);
        Task<Result<PatientResponse>> GetByIdAsync(int id, int currentUserId, bool isStaff);
        Task<Result<PatientResponse>> CreateAsync(CreatePatientRequest request, int currentUserId);
        Task<Result<PatientResponse>> UpdateAsync(int id, UpdatePatientRequest request, int currentUserId, bool isStaff);
        Task<Result> DeleteAsync(int id, int currentUserId, bool isStaff);
        Task<Result<PatientHistoryResponse>> GetHistoryAsync(int id, int currentUserId, bool isStaff);
    }
}
