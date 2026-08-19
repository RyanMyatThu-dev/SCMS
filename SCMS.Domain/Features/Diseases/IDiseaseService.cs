using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Diseases.Models;

namespace SCMS.Domain.Features.Diseases
{
    public interface IDiseaseService
    {
        Task<PagedResult<GetDiseasesResponse>> GetDiseasesAsync(GetDiseasesRequest request);
        Task<PagedResult<SearchDiseasesResponse>> SearchDiseasesAsync(SearchDiseasesRequest request);
        Task<Result<CreateDiseaseResponse>> CreateDiseaseAsync(CreateDiseaseRequest request);
        Task<Result<UpdateDiseaseResponse>> UpdateDiseaseAsync(UpdateDiseaseRequest request);
        Task<Result<bool>> DeactivateDiseaseAsync(int id);
    }
}
