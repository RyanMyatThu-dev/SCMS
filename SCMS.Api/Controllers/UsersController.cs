using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Users;
using SCMS.Domain.Features.Users.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>List staff and admin users with role and text search filtering.</summary>
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

        /// <summary>Get user details by user ID.</summary>
        [HttpGet("{id:int}")]
        [HasPermission("Users.View")]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result<StaffUserResponse>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(int id, CancellationToken cancellationToken)
        {
            var result = await _userService.GetUserByIdAsync(id, cancellationToken);
            if (result.IsFailure) return NotFound(result);
            return Ok(result);
        }

        /// <summary>Create a new staff user account with assigned roles.</summary>
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

        /// <summary>Update assigned security roles for a user.</summary>
        [HttpPut("{id:int}/roles")]
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

        /// <summary>Soft-delete a user account.</summary>
        [HttpDelete("{id:int}")]
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
