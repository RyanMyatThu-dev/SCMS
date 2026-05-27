using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Shared;

namespace SCMS.Domain.Features.Dashboards
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardsController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardsController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
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

        [HttpGet("doctor")]
        public async Task<IActionResult> GetDoctorDashboard()
        {
            var result = await _dashboardService.GetDoctorDashboardAsync();
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("patient")]
        public async Task<IActionResult> GetPatientDashboard()
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetPatientDashboardAsync(userId);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
