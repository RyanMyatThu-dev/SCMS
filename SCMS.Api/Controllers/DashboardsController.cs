using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Dashboards;
using SCMS.Domain.Features.Dashboards.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class DashboardsController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardsController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>Retrieves clinic operations, revenue/income summary, monthly/weekly/daily breakdowns, and live queue status for staff.</summary>
        [HttpGet("dashboard")]
        [HasPermission("Dashboards.View")]
        [ProducesResponseType(typeof(Result<DoctorDashboardResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetDoctorDashboard([FromQuery] GetDoctorDashboardRequest? request, CancellationToken cancellationToken = default)
        {
            var result = await _dashboardService.GetDoctorDashboardAsync(request ?? new GetDoctorDashboardRequest(), cancellationToken);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Retrieves upcoming appointments, prescription history, and unpaid balances for the logged-in patient.</summary>
        [HttpGet("patient-dashboard")]
        [HasPermission("Dashboards.View")]
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
