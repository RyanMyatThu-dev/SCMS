using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Prescriptions;

namespace SCMS.Domain.Features.Prescriptions
{
    public interface IPrescriptionService
    {
        Task<Result<IEnumerable<PrescriptionListDto>>> GetAllAsync(PrescriptionFilterDto filter, int currentUserId, bool isStaff);
        Task<Result<PrescriptionDetailDto>> GetByIdAsync(int id, int currentUserId, bool isStaff);
        Task<Result<PrescriptionDetailDto>> CreateAsync(CreatePrescriptionDto dto, int currentUserId);
        Task<Result<PrescriptionDetailDto>> UpdateAsync(int id, UpdatePrescriptionDto dto, int currentUserId, bool isStaff);
        Task<Result> DeleteAsync(int id, int currentUserId, bool isStaff);
    }
}
