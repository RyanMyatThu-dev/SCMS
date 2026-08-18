using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Payments;

namespace SCMS.Domain.Features.Payments
{
    public interface IPaymentService
    {
        Task<Result<IEnumerable<PaymentResponse>>> GetAllAsync(int? appointmentId, string? status, int currentUserId, bool isStaff);
        Task<Result<PaymentResponse>> GetByIdAsync(int id, int currentUserId, bool isStaff);
        Task<Result<PaymentResponse>> CreateAsync(CreatePaymentRequest request, int currentUserId);
        Task<Result<PaymentResponse>> UpdateStatusAsync(int id, UpdatePaymentStatusRequest request, int currentUserId, bool isStaff);
    }
}
