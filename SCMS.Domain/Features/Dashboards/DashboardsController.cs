using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.DTOs;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Dashboards
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class DashboardsController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardsController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Retrieves clinic operations, revenue/income summary, and live queue status for staff (Owner, Admin, Doctor).
        /// </summary>
        /// <param name="period">Aggregation period: "daily" (default), "weekly", "monthly", or "all".</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        [HttpGet("dashboard")]
        [Authorize(Roles = "owner,admin,doctor")]
        [ProducesResponseType(typeof(Result<DoctorDashboardResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetDoctorDashboard([FromQuery] string period = "daily", CancellationToken cancellationToken = default)
        {
            var result = await _dashboardService.GetDoctorDashboardAsync(period, cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Retrieves upcoming appointments, prescription history, and unpaid balances for the logged-in patient.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        [HttpGet("patient-dashboard")]
        [ProducesResponseType(typeof(Result<PatientDashboardResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetPatientDashboard(CancellationToken cancellationToken = default)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _dashboardService.GetPatientDashboardAsync(userId.Value, cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
