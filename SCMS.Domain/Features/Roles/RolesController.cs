using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.DTOs;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Roles
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly RoleService _roleService;

        public RolesController(RoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        [HasPermission("Roles.View")]
        [ProducesResponseType(typeof(Result<List<RoleResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
        {
            var result = await _roleService.GetRolesAsync(cancellationToken);
            return Ok(result);
        }

        [HttpGet("{roleName}")]
        [HasPermission("Roles.View")]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRoleByName(string roleName, CancellationToken cancellationToken)
        {
            var result = await _roleService.GetRoleByNameAsync(roleName, cancellationToken);
            if (result.IsFailure) return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [HasPermission("Roles.Create")]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request, CancellationToken cancellationToken)
        {
            var result = await _roleService.CreateRoleAsync(request, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return CreatedAtAction(nameof(GetRoleByName), new { roleName = result.Data!.RoleName }, result);
        }

        [HttpPut("{roleName}/permissions")]
        [HasPermission("Roles.Update")]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result<RoleResponse>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AssignPermissions(
            string roleName,
            [FromBody] AssignRolePermissionsRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _roleService.AssignPermissionsToRoleAsync(roleName, request, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{roleName}/permissions/grant")]
        [HasPermission("Roles.Update")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GrantPermission(
            string roleName,
            [FromBody] ModifyPermissionRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _roleService.GrantPermissionToRoleAsync(roleName, request.PermissionKey, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{roleName}/permissions/revoke")]
        [HasPermission("Roles.Update")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RevokePermission(
            string roleName,
            [FromBody] ModifyPermissionRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _roleService.RevokePermissionFromRoleAsync(roleName, request.PermissionKey, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("{roleName}")]
        [HasPermission("Roles.Delete")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteRole(string roleName, CancellationToken cancellationToken)
        {
            var result = await _roleService.DeleteRoleAsync(roleName, cancellationToken);
            if (result.IsFailure) return BadRequest(result);
            return Ok(result);
        }
    }
}
