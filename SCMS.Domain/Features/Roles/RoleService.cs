using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Features.Roles.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Roles
{
    public class RoleService : IRoleService
    {
        private readonly AppDbContext _context;
        private readonly IPermissionService _permissionService;

        private static readonly HashSet<string> DefaultSystemRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "owner", "admin", "doctor", "user"
        };

        public RoleService(AppDbContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        public async Task<Result<List<RoleResponse>>> GetRolesAsync(CancellationToken cancellationToken = default)
        {
            // Gather all role names from DB and defaults
            var dbRoles = await _context.TblUserRoles
                .AsNoTracking()
                .Select(r => r.Role.Trim())
                .Distinct()
                .ToListAsync(cancellationToken);

            var allRoleNames = DefaultSystemRoles
                .Union(dbRoles, StringComparer.OrdinalIgnoreCase)
                .OrderBy(r => r)
                .ToList();

            var roleResponses = new List<RoleResponse>();

            foreach (var roleName in allRoleNames)
            {
                var roleInfo = await BuildRoleResponseAsync(roleName, cancellationToken);
                roleResponses.Add(roleInfo);
            }

            return Result<List<RoleResponse>>.Success(roleResponses);
        }

        public async Task<Result<RoleResponse>> GetRoleByNameAsync(string roleName, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Result<RoleResponse>.Failure("Role name is required.");
            }

            var trimmedName = roleName.Trim();
            var exists = DefaultSystemRoles.Contains(trimmedName) ||
                         await _context.TblUserRoles.AnyAsync(r => r.Role.ToLower() == trimmedName.ToLower(), cancellationToken);

            if (!exists)
            {
                return Result<RoleResponse>.Failure($"Role '{trimmedName}' was not found.");
            }

            var response = await BuildRoleResponseAsync(trimmedName, cancellationToken);
            return Result<RoleResponse>.Success(response);
        }

        public async Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.RoleName))
            {
                return Result<RoleResponse>.Failure("Role name is required.");
            }

            var roleName = request.RoleName.Trim();
            var alreadyExists = DefaultSystemRoles.Contains(roleName) ||
                                await _context.TblUserRoles.AnyAsync(r => r.Role.ToLower() == roleName.ToLower(), cancellationToken);

            if (alreadyExists)
            {
                return Result<RoleResponse>.Failure($"Role '{roleName}' already exists.");
            }

            // Assign initial permissions if provided
            if (request.Permissions != null && request.Permissions.Count > 0)
            {
                await AssignPermissionsInternalAsync(roleName, request.Permissions, cancellationToken);
            }

            var response = await BuildRoleResponseAsync(roleName, cancellationToken);
            _permissionService.InvalidateAll();
            return Result<RoleResponse>.Success(response, $"Role '{roleName}' created successfully.");
        }

        public async Task<Result> DeleteRoleAsync(string roleName, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Result.Failure("Role name is required.");
            }

            var trimmedName = roleName.Trim();

            if (string.Equals(trimmedName, "owner", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmedName, "user", StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure($"System role '{trimmedName}' cannot be deleted.");
            }

            var userRoles = await _context.TblUserRoles
                .Where(r => r.Role.ToLower() == trimmedName.ToLower())
                .ToListAsync(cancellationToken);

            if (userRoles.Count > 0)
            {
                var userRoleIds = userRoles.Select(ur => ur.Id).ToList();

                var rolePermissions = await _context.TblRolePermissions
                    .Where(rp => userRoleIds.Contains(rp.RoleId))
                    .ToListAsync(cancellationToken);

                _context.TblRolePermissions.RemoveRange(rolePermissions);
                _context.TblUserRoles.RemoveRange(userRoles);

                // Ensure users who had this role still have at least "user" role if they now have none
                var userIds = userRoles.Select(ur => ur.UserId).Distinct().ToList();
                foreach (var userId in userIds)
                {
                    var remainingRolesCount = await _context.TblUserRoles
                        .CountAsync(ur => ur.UserId == userId && ur.Role.ToLower() != trimmedName.ToLower(), cancellationToken);

                    if (remainingRolesCount == 0)
                    {
                        _context.TblUserRoles.Add(new TblUserRole
                        {
                            UserId = userId,
                            Role = "user"
                        });
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
            }

            _permissionService.InvalidateAll();
            return Result.Success($"Role '{trimmedName}' deleted successfully.");
        }

        public async Task<Result<List<PermissionResponse>>> GetPermissionsAsync(CancellationToken cancellationToken = default)
        {
            var permissions = await _context.TblPermissions
                .AsNoTracking()
                .OrderBy(p => p.Menu)
                .ThenBy(p => p.Action)
                .Select(p => new PermissionResponse
                {
                    Id = p.Id,
                    Menu = p.Menu,
                    Action = p.Action
                })
                .ToListAsync(cancellationToken);

            return Result<List<PermissionResponse>>.Success(permissions);
        }

        public async Task<Result<RoleResponse>> AssignPermissionsToRoleAsync(
            string roleName,
            AssignRolePermissionsRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return Result<RoleResponse>.Failure("Role name is required.");
            }

            var trimmedName = roleName.Trim();
            if (string.Equals(trimmedName, "owner", StringComparison.OrdinalIgnoreCase))
            {
                return Result<RoleResponse>.Failure("The Owner role inherently possesses all permissions and cannot be restricted.");
            }

            await AssignPermissionsInternalAsync(trimmedName, request.Permissions, cancellationToken);
            _permissionService.InvalidateAll();

            var response = await BuildRoleResponseAsync(trimmedName, cancellationToken);
            return Result<RoleResponse>.Success(response, $"Permissions assigned to role '{trimmedName}'.");
        }

        public async Task<Result> GrantPermissionToRoleAsync(
            string roleName,
            string permissionKey,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleName) || string.IsNullOrWhiteSpace(permissionKey))
            {
                return Result.Failure("Role name and permission key are required.");
            }

            var trimmedRole = roleName.Trim();
            var trimmedPerm = permissionKey.Trim();

            var permission = await FindPermissionByKeyAsync(trimmedPerm, cancellationToken);
            if (permission == null)
            {
                return Result.Failure($"Permission '{trimmedPerm}' does not exist in the system.");
            }

            var userRoles = await _context.TblUserRoles
                .Where(r => r.Role.ToLower() == trimmedRole.ToLower())
                .ToListAsync(cancellationToken);

            foreach (var userRole in userRoles)
            {
                var exists = await _context.TblRolePermissions
                    .AnyAsync(rp => rp.RoleId == userRole.Id && rp.PermissionId == permission.Id, cancellationToken);

                if (!exists)
                {
                    _context.TblRolePermissions.Add(new TblRolePermission
                    {
                        RoleId = userRole.Id,
                        PermissionId = permission.Id
                    });
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            _permissionService.InvalidateAll();
            return Result.Success($"Permission '{trimmedPerm}' granted to role '{trimmedRole}'.");
        }

        public async Task<Result> RevokePermissionFromRoleAsync(
            string roleName,
            string permissionKey,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(roleName) || string.IsNullOrWhiteSpace(permissionKey))
            {
                return Result.Failure("Role name and permission key are required.");
            }

            var trimmedRole = roleName.Trim();
            var trimmedPerm = permissionKey.Trim();

            if (string.Equals(trimmedRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure("Permissions cannot be revoked from the Owner role.");
            }

            var permission = await FindPermissionByKeyAsync(trimmedPerm, cancellationToken);
            if (permission == null)
            {
                return Result.Failure($"Permission '{trimmedPerm}' does not exist in the system.");
            }

            var userRoles = await _context.TblUserRoles
                .Where(r => r.Role.ToLower() == trimmedRole.ToLower())
                .Select(r => r.Id)
                .ToListAsync(cancellationToken);

            var toRemove = await _context.TblRolePermissions
                .Where(rp => userRoles.Contains(rp.RoleId) && rp.PermissionId == permission.Id)
                .ToListAsync(cancellationToken);

            if (toRemove.Count > 0)
            {
                _context.TblRolePermissions.RemoveRange(toRemove);
                await _context.SaveChangesAsync(cancellationToken);
            }

            _permissionService.InvalidateAll();
            return Result.Success($"Permission '{trimmedPerm}' revoked from role '{trimmedRole}'.");
        }

        private async Task<TblPermission?> FindPermissionByKeyAsync(string key, CancellationToken cancellationToken)
        {
            var parts = key.Split('.', 2);
            if (parts.Length != 2)
            {
                return null;
            }

            var menu = parts[0].Trim();
            var action = parts[1].Trim();

            return await _context.TblPermissions
                .FirstOrDefaultAsync(p => p.Menu.ToLower() == menu.ToLower() && p.Action.ToLower() == action.ToLower(), cancellationToken);
        }

        private async Task AssignPermissionsInternalAsync(
            string roleName,
            List<string> permissionKeys,
            CancellationToken cancellationToken)
        {
            var allPermissions = await _context.TblPermissions.ToListAsync(cancellationToken);
            var permMap = allPermissions.ToDictionary(
                p => $"{p.Menu}.{p.Action}",
                p => p.Id,
                StringComparer.OrdinalIgnoreCase);

            var targetPermissionIds = permissionKeys
                .Where(k => permMap.ContainsKey(k.Trim()))
                .Select(k => permMap[k.Trim()])
                .Distinct()
                .ToList();

            var userRoles = await _context.TblUserRoles
                .Where(r => r.Role.ToLower() == roleName.ToLower())
                .ToListAsync(cancellationToken);

            if (userRoles.Count > 0)
            {
                var userRoleIds = userRoles.Select(r => r.Id).ToList();

                var existing = await _context.TblRolePermissions
                    .Where(rp => userRoleIds.Contains(rp.RoleId))
                    .ToListAsync(cancellationToken);

                _context.TblRolePermissions.RemoveRange(existing);

                foreach (var ur in userRoles)
                {
                    foreach (var permId in targetPermissionIds)
                    {
                        _context.TblRolePermissions.Add(new TblRolePermission
                        {
                            RoleId = ur.Id,
                            PermissionId = permId
                        });
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task<RoleResponse> BuildRoleResponseAsync(string roleName, CancellationToken cancellationToken)
        {
            var userCount = await _context.TblUserRoles
                .AsNoTracking()
                .CountAsync(r => r.Role.ToLower() == roleName.ToLower() && r.User.DeleteFlag != true, cancellationToken);

            List<string> permissions;

            if (string.Equals(roleName, "owner", StringComparison.OrdinalIgnoreCase))
            {
                permissions = await _context.TblPermissions
                    .AsNoTracking()
                    .Select(p => p.Menu + "." + p.Action)
                    .ToListAsync(cancellationToken);
            }
            else
            {
                permissions = await _context.TblRolePermissions
                    .AsNoTracking()
                    .Where(rp => _context.TblUserRoles.Any(ur => ur.Id == rp.RoleId && ur.Role.ToLower() == roleName.ToLower()))
                    .Select(rp => rp.Permission.Menu + "." + rp.Permission.Action)
                    .Distinct()
                    .OrderBy(p => p)
                    .ToListAsync(cancellationToken);
            }

            return new RoleResponse
            {
                RoleName = roleName,
                UserCount = userCount,
                Permissions = permissions
            };
        }
    }
}
