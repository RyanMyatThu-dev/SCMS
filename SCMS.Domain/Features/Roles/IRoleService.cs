using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Roles;

namespace SCMS.Domain.Features.Roles
{
    public interface IRoleService
    {
        Task<Result<IEnumerable<RoleDto>>> GetRolesAsync();
        Task<Result<RoleDto>> GetRoleByIdAsync(int id);
        Task<Result<RoleDto>> CreateRoleAsync(CreateRoleRequest request);
        Task<Result<RoleDto>> UpdateRoleAsync(int id, UpdateRoleRequest request);
        Task<Result> DeleteRoleAsync(int id);
        Task<Result<IEnumerable<PermissionDto>>> GetAllPermissionsAsync();
        Task<Result<IEnumerable<PermissionDto>>> GetRolePermissionsAsync(int roleId);
        Task<Result> UpdateRolePermissionsAsync(int roleId, UpdateRolePermissionsRequest request);
    }
}
