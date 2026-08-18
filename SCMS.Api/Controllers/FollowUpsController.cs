using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.FollowUps;
using SCMS.Domain.Features.FollowUps.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class FollowUpsController : ControllerBase
    {
        private readonly IFollowUpService _followUpService;

        public FollowUpsController(IFollowUpService followUpService)
        {
            _followUpService = followUpService;
        }

        /// <summary>Query follow-up tasks for patients or clinic staff.</summary>
        [HttpGet]
        [HasPermission("FollowUps.View")]
        [ProducesResponseType(typeof(PagedResult<FollowUpResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetFollowUp([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(Result.Failure("User id claim is missing."));

            paginationRequest ??= new PaginationRequest();
            var result = await _followUpService.GetFollowUpsAsync(patientId, userId.Value, User.IsStaff(), paginationRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Schedule a new follow-up task.</summary>
        [HttpPost]
        [HasPermission("FollowUps.Create")]
        [ProducesResponseType(typeof(Result<FollowUpResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateFollowUp([FromBody] FollowUpRequest request)
        {
            var result = await _followUpService.CreateFollowUpAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Mark a scheduled follow-up as completed.</summary>
        [HttpPost("{id:int}/complete")]
        [HasPermission("FollowUps.Update")]
        [ProducesResponseType(typeof(Result<FollowUpResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CompleteFollowUp(int id)
        {
            var result = await _followUpService.CompleteFollowUpAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
