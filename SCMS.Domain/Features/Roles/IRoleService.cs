using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Roles.Models;

namespace SCMS.Domain.Features.Roles
{
    public interface IRoleService
    {
        Task<Result<List<RoleResponse>>> GetRolesAsync(CancellationToken cancellationToken = default);
        Task<Result<RoleResponse>> GetRoleByNameAsync(string roleName, CancellationToken cancellationToken = default);
        Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);
        Task<Result> DeleteRoleAsync(string roleName, CancellationToken cancellationToken = default);
        Task<Result<List<PermissionResponse>>> GetPermissionsAsync(CancellationToken cancellationToken = default);
        Task<Result<RoleResponse>> AssignPermissionsToRoleAsync(string roleName, AssignRolePermissionsRequest request, CancellationToken cancellationToken = default);
        Task<Result> GrantPermissionToRoleAsync(string roleName, string permissionKey, CancellationToken cancellationToken = default);
        Task<Result> RevokePermissionFromRoleAsync(string roleName, string permissionKey, CancellationToken cancellationToken = default);
    }
}
