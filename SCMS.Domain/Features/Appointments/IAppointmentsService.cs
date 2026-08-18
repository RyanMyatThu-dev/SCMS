using System;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Appointments;

namespace SCMS.Domain.Features.Appointments
{
    public interface IAppointmentsService
    {
        Task<Result<BookAppointmentResponse>> BookAppointmentAsync(BookAppointmentRequest request, int createdByUserId);
        Task<Result<AppointmentDetailResponse>> GetAppointmentByIdAsync(int id, int requestUserId, bool isStaff);
        Task<Result<AppointmentListResponse>> GetAppointmentsAsync(AppointmentListFilter filter, int requestUserId, bool isStaff);
        Task<Result<AppointmentQueueResponse>> GetQueueStatusAsync(DateTime date);
        Task<Result<AppointmentStatusResponse>> UpdateAppointmentStatusAsync(int id, UpdateAppointmentStatusRequest request, int updatedByUserId);
        Task<Result<UpdateAppointmentResponse>> UpdateAppointmentAsync(int id, UpdateAppointmentRequest request, int updatedByUserId);
        Task<Result> CancelAppointmentAsync(int id, CancelAppointmentRequest request, int canceledByUserId);
    }
}
