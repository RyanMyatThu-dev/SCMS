using System;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Appointments.Models;

namespace SCMS.Domain.Features.Appointments
{
    public interface IAppointmentsService
    {
        Task<Result<BookAppointmentResponse>> BookAppointmentAsync(BookAppointmentRequest request, int userId);
        Task<Result<AppointmentDetailsResponse>> UpdateAppointmentStatusAsync(int id, UpdateAppointmentStatusRequest request);
        Task<Result<AppointmentDetailsResponse>> RescheduleAppointmentAsync(int id, RescheduleAppointmentRequest request);
        Task<PagedResult<AppointmentDetailsResponse>> GetAppointmentsAsync(DateTime? startDate, DateTime? endDate, string? status, int? patientId, PaginationRequest paginationRequest, int? currentUserId = null, bool isStaff = true);
        Task<Result<AppointmentQueueStatusResponse>> GetPatientQueueStatusAsync(int id);
        Task<Result<AppointmentDetailsResponse>> CallNextPatientAsync();
    }
}
