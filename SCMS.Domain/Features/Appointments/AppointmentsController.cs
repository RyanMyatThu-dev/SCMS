using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Appointments
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentsService _appointmentsService;

        public AppointmentsController(AppointmentsService appointmentsService)
        {
            _appointmentsService = appointmentsService;
        }

        private int GetUserId()
        {
            if (Request.Headers.TryGetValue("X-User-Id", out var headerValue) && int.TryParse(headerValue, out var headerUserId))
            {
                return headerUserId;
            }
            if (Request.Query.TryGetValue("userId", out var queryValue) && int.TryParse(queryValue, out var queryUserId))
            {
                return queryUserId;
            }
            return 1; // Demo fallback
        }

        [HttpPost]
        public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequest request)
        {
            var userId = GetUserId();
            var result = await _appointmentsService.BookAppointmentAsync(request, userId);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAppointments(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] string? status,
            [FromQuery] int? patientId,
            [FromQuery] PaginationRequest paginationRequest)
        {
            // Bind fallback defaults if request properties are empty
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _appointmentsService.GetAppointmentsAsync(startDate, endDate, status, patientId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateAppointmentStatus(int id, [FromBody] UpdateAppointmentStatusRequest request)
        {
            var result = await _appointmentsService.UpdateAppointmentStatusAsync(id, request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("{id:int}/reschedule")]
        public async Task<IActionResult> RescheduleAppointment(int id, [FromBody] RescheduleAppointmentRequest request)
        {
            var result = await _appointmentsService.RescheduleAppointmentAsync(id, request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}/queue-status")]
        public async Task<IActionResult> GetPatientQueueStatus(int id)
        {
            var result = await _appointmentsService.GetPatientQueueStatusAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("call-next")]
        public async Task<IActionResult> CallNextPatient()
        {
            var result = await _appointmentsService.CallNextPatientAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
