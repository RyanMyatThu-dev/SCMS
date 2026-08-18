using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Diseases.Models;

namespace SCMS.Domain.Features.Diseases
{
    public interface IDiseaseService
    {
        Task<PagedResult<DiseaseResponse>> GetDiseasesAsync(DiseaseRequest request);
        Task<Result<DiseaseResponse>> CreateDiseaseAsync(CreateDiseaseRequest request);
        Task<Result<DiseaseResponse>> UpdateDiseaseAsync(UpdateDiseaseRequest request);
        Task<Result<bool>> DeactivateDiseaseAsync(int id);
    }
}
