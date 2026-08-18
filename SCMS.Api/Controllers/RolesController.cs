using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Roles;
using SCMS.Domain.Features.Roles.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>List all system roles with assigned permission lists and active user counts.</summary>
        [HttpGet]
        [HasPermission("Roles.View")]
        [ProducesResponseType(typeof(Result<List<RoleResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
        {
            var result = await _roleService.GetRolesAsync(cancellationToken);
            return Ok(result);
        }

        /// <summary>Get role details and permissions by role name.</summary>
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

        /// <summary>Create a new security role with initial permissions.</summary>
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

        /// <summary>Bulk assign permissions to a role.</summary>
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

        /// <summary>Grant a single permission to a role.</summary>
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

        /// <summary>Revoke a single permission from a role.</summary>
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

        /// <summary>Delete a custom security role.</summary>
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
