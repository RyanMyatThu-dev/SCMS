using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.DTOs;
using SCMS.Domain.Features.Roles;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Permissions
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly RoleService _roleService;

        public PermissionsController(RoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        [HasPermission("Permissions.View")]
        [ProducesResponseType(typeof(Result<List<PermissionResponse>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPermissions(CancellationToken cancellationToken)
        {
            var result = await _roleService.GetPermissionsAsync(cancellationToken);
            return Ok(result);
        }
    }
}
