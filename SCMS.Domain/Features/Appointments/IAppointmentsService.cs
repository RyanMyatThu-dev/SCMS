using System;
using System.Threading.Tasks;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Appointments
{
    public interface IAppointmentsService
    {
        Task<Result<BookAppointmentResponse>> BookAppointmentAsync(BookAppointmentRequest request, int userId);
        Task<Result<UpdateAppointmentStatusResponse>> UpdateAppointmentStatusAsync(int id, UpdateAppointmentStatusRequest request);
        Task<Result<RescheduleAppointmentResponse>> RescheduleAppointmentAsync(int id, RescheduleAppointmentRequest request);
        Task<PagedResult<GetAppointmentsResponse>> GetAppointmentsAsync(GetAppointmentsRequest request, int? currentUserId = null, bool isStaff = true);
        Task<Result<AppointmentQueueStatusResponse>> GetPatientQueueStatusAsync(int id);
        Task<Result<CallNextPatientResponse>> CallNextPatientAsync();
    }
}
