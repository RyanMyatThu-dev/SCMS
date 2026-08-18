using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Payments.Models;

namespace SCMS.Domain.Features.Payments
{
    public interface IPaymentService
    {
        Task<Result<PaymentDetailsResponse>> ProcessGatewayCallbackAsync(ProcessPaymentCallbackRequest request);
        Task<Result<PaymentDetailsResponse>> SubmitManualPaymentProofAsync(ManualPaymentProofRequest request);
        Task<Result<PaymentDetailsResponse>> ApprovePaymentAsync(int paymentId);
        Task<PagedResult<PaymentDetailsResponse>> GetPaymentsAsync(string? status, PaginationRequest paginationRequest, string? dateFilter = null, string? searchQuery = null);
        Task<Result<PaymentDetailsResponse>> GetPaymentByIdAsync(int id);
    }
}
