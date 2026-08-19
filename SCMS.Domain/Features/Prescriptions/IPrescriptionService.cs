using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Prescriptions.Models;

namespace SCMS.Domain.Features.Prescriptions
{
    public interface IPrescriptionService
    {
        Task<Result<CreatePrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request);
        Task<Result<GetPrescriptionDetailsResponse>> GetPrescriptionDetailsAsync(int id);
        Task<PagedResult<GetPrescriptionsResponse>> GetPrescriptionsAsync(GetPrescriptionsRequest request);
        Task<Result<SaveTemplateResponse>> SaveTemplateAsync(SaveTemplateRequest request);
        Task<Result<bool>> DeleteTemplateAsync(int id);
        Task<PagedResult<GetTemplatesResponse>> GetTemplatesAsync(GetTemplatesRequest request);
    }
}
