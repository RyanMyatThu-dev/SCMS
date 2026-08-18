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
    public class PermissionsController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public PermissionsController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>List all available system permissions grouped by menu and action.</summary>
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
