using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.DTOs;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Users
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserService _userService;

        public UsersController(UserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [HasPermission("Users.View")]
        [ProducesResponseType(typeof(Result<List<StaffUserResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? role,
            [FromQuery] string? search,
            CancellationToken cancellationToken)
        {
            var result = await _userService.GetUsersAsync(role, search, cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [HasPermission("Users.View")]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int id, CancellationToken cancellationToken)
        {
            var result = await _userService.GetUserByIdAsync(id, cancellationToken);
            if (result.IsFailure) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [HasPermission("Users.Create")]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateStaffUser(
            [FromBody] CreateStaffUserRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _userService.CreateStaffUserAsync(request, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return CreatedAtAction(nameof(GetUserById), new { id = result.Data!.UserId }, result);
        }

        [HttpPut("{id}/roles")]
        [HasPermission("Users.Update")]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateUserRoles(
            int id,
            [FromBody] UpdateUserRolesRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _userService.UpdateUserRolesAsync(id, request, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [HasPermission("Users.Delete")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
        {
            var result = await _userService.DeleteUserAsync(id, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }
    }
}
