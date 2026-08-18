using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Appointments;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentsService _appointmentsService;

        public AppointmentsController(IAppointmentsService appointmentsService)
        {
            _appointmentsService = appointmentsService;
        }

        /// <summary>Book a new clinic appointment.</summary>
        [HttpPost]
        [HasPermission("Appointments.Create")]
        [ProducesResponseType(typeof(Result<BookAppointmentResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequest request)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _appointmentsService.BookAppointmentAsync(request, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Query appointments with optional date, status, and patient filtering.</summary>
        [HttpGet]
        [HasPermission("Appointments.View")]
        [ProducesResponseType(typeof(PagedResult<AppointmentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAppointments(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status,
            [FromQuery] int? patientId,
            [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _appointmentsService.GetAppointmentsAsync(startDate, endDate, status, patientId, paginationRequest, userId.Value, User.IsStaff());
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Update the status of an appointment.</summary>
        [HttpPatch("{id:int}/status")]
        [HasPermission("Appointments.UpdateStatus")]
        [ProducesResponseType(typeof(Result<AppointmentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateAppointmentStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            var result = await _appointmentsService.UpdateAppointmentStatusAsync(id, request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Reschedule an existing appointment.</summary>
        [HttpPost("{id:int}/reschedule")]
        [HasPermission("Appointments.Update")]
        [ProducesResponseType(typeof(Result<AppointmentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RescheduleAppointment(int id, [FromBody] RescheduleAppointmentRequest request)
        {
            var result = await _appointmentsService.RescheduleAppointmentAsync(id, request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Retrieve real-time queue status for an appointment.</summary>
        [HttpGet("{id:int}/queue-status")]
        [HasPermission("Appointments.View")]
        [ProducesResponseType(typeof(Result<AppointmentQueueStatusResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPatientQueueStatus(int id)
        {
            var result = await _appointmentsService.GetPatientQueueStatusAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Advance the queue and call the next waiting patient.</summary>
        [HttpPost("call-next")]
        [HasPermission("Appointments.UpdateStatus")]
        [ProducesResponseType(typeof(Result<AppointmentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CallNextPatient()
        {
            var result = await _appointmentsService.CallNextPatientAsync();
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }
    }
}
