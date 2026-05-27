using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Security;
using SCMS.Shared;
using SCMS.Shared.Contracts.FollowUps;

namespace SCMS.Domain.Features.FollowUps
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class FollowUpsController : ControllerBase
    {
        private readonly FollowUpService _followUpService;

        public FollowUpsController(FollowUpService followUpService)
        {
            _followUpService = followUpService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(Result.Failure("User id claim is missing."));

            paginationRequest ??= new PaginationRequest();
            var result = await _followUpService.GetFollowUpsAsync(patientId, userId.Value, User.IsStaff(), paginationRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [Authorize(Roles = "admin,doctor")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FollowUpRequest request)
        {
            var result = await _followUpService.CreateFollowUpAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [Authorize(Roles = "admin,doctor")]
        [HttpPost("{id:int}/complete")]
        public async Task<IActionResult> Complete(int id)
        {
            var result = await _followUpService.CompleteFollowUpAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
