using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        [HttpGet("dashboard")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDoctorDashboard()
        {
            var result = await _dashboardService.GetDoctorDashboardAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("patient-dashboard")]
        public async Task<IActionResult> GetPatientDashboard()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _dashboardService.GetPatientDashboardAsync(userId.Value);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
