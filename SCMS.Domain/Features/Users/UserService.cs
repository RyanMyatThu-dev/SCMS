using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Common;
using SCMS.Domain.DTOs;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Users
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly PasswordHashingService _passwords;
        private readonly IPermissionService _permissionService;

        public UserService(
            AppDbContext context,
            PasswordHashingService passwords,
            IPermissionService permissionService)
        {
            _context = context;
            _passwords = passwords;
            _permissionService = permissionService;
        }

        public async Task<Result<List<StaffUserResponse>>> GetUsersAsync(
            string? roleFilter = null,
            string? search = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.TblUsers
                .AsNoTracking()
                .Include(u => u.TblUserRoles)
                .Where(u => u.DeleteFlag != true);

            if (!string.IsNullOrWhiteSpace(roleFilter))
            {
                var normRole = roleFilter.Trim().ToLowerInvariant();
                query = query.Where(u => u.TblUserRoles.Any(r => r.Role.ToLower() == normRole));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(u =>
                    u.Name.ToLower().Contains(term) ||
                    (u.Email != null && u.Email.ToLower().Contains(term)) ||
                    (u.MobileNo != null && u.MobileNo.Contains(term)));
            }

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new StaffUserResponse
                {
                    UserId = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    MobileNo = u.MobileNo,
                    Roles = u.TblUserRoles.Select(r => r.Role).Distinct().ToList(),
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return Result<List<StaffUserResponse>>.Success(users);
        }

        public async Task<Result<StaffUserResponse>> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.TblUsers
                .AsNoTracking()
                .Include(u => u.TblUserRoles)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.DeleteFlag != true, cancellationToken);

            if (user == null)
            {
                return Result<StaffUserResponse>.Failure("User not found.");
            }

            var response = new StaffUserResponse
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                MobileNo = user.MobileNo,
                Roles = user.TblUserRoles.Select(r => r.Role).Distinct().ToList(),
                CreatedAt = user.CreatedAt
            };

            return Result<StaffUserResponse>.Success(response);
        }

        public async Task<Result<StaffUserResponse>> CreateStaffUserAsync(
            CreateStaffUserRequest request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result<StaffUserResponse>.Failure("Name is required.");
            }

            string? email = null;
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                if (!ValidationHelper.IsValidEmail(request.Email, out var normEmail))
                {
                    return Result<StaffUserResponse>.Failure("A valid email address is required.");
                }
                email = normEmail;
            }

            string? mobile = null;
            if (!string.IsNullOrWhiteSpace(request.MobileNo))
            {
                if (!ValidationHelper.IsValidMyanmarMobile(request.MobileNo, out var normMobile))
                {
                    return Result<StaffUserResponse>.Failure("Invalid mobile number. Please provide a valid Myanmar mobile number (e.g. 09xxxxxxxxx or +959xxxxxxxxx).");
                }
                mobile = normMobile;
            }

            if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(mobile))
            {
                return Result<StaffUserResponse>.Failure("Either an email address or mobile number is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return Result<StaffUserResponse>.Failure("Password must be at least 8 characters.");
            }

            var cleanRoles = request.Roles
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (cleanRoles.Count == 0)
            {
                return Result<StaffUserResponse>.Failure("At least one valid role must be assigned.");
            }

            var exists = await _context.TblUsers.AnyAsync(u =>
                u.DeleteFlag != true &&
                ((email != null && u.Email == email) || (mobile != null && u.MobileNo == mobile)),
                cancellationToken);

            if (exists)
            {
                return Result<StaffUserResponse>.Failure("An account with that email or mobile number already exists.");
            }

            var now = DateTime.UtcNow;
            var user = new TblUser
            {
                Name = request.Name.Trim(),
                Email = email,
                MobileNo = mobile,
                PasswordHash = _passwords.HashPassword(request.Password),
                CreatedAt = now,
                UpdatedAt = now,
                DeleteFlag = false
            };

            foreach (var role in cleanRoles)
            {
                var userRole = new TblUserRole
                {
                    Role = role
                };

                // Copy permissions from any existing template / peer user role of the same role name
                var existingRolePermissions = await _context.TblRolePermissions
                    .AsNoTracking()
                    .Where(rp => _context.TblUserRoles.Any(ur => ur.Id == rp.RoleId && ur.Role.ToLower() == role.ToLower()))
                    .Select(rp => rp.PermissionId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                foreach (var permId in existingRolePermissions)
                {
                    userRole.TblRolePermissions.Add(new TblRolePermission
                    {
                        PermissionId = permId
                    });
                }

                user.TblUserRoles.Add(userRole);
            }

            _context.TblUsers.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            var response = new StaffUserResponse
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                MobileNo = user.MobileNo,
                Roles = cleanRoles,
                CreatedAt = user.CreatedAt
            };

            _permissionService.InvalidateUserPermissions(user.UserId);
            return Result<StaffUserResponse>.Success(response, "User created successfully.");
        }

        public async Task<Result<StaffUserResponse>> UpdateUserRolesAsync(
            int userId,
            UpdateUserRolesRequest request,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.TblUsers
                .Include(u => u.TblUserRoles)
                    .ThenInclude(ur => ur.TblRolePermissions)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.DeleteFlag != true, cancellationToken);

            if (user == null)
            {
                return Result<StaffUserResponse>.Failure("User not found.");
            }

            var cleanRoles = request.Roles
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (cleanRoles.Count == 0)
            {
                return Result<StaffUserResponse>.Failure("At least one valid role must be specified.");
            }

            // Remove old roles and their permissions
            _context.TblRolePermissions.RemoveRange(user.TblUserRoles.SelectMany(ur => ur.TblRolePermissions));
            _context.TblUserRoles.RemoveRange(user.TblUserRoles);

            foreach (var role in cleanRoles)
            {
                var userRole = new TblUserRole
                {
                    UserId = user.UserId,
                    Role = role
                };

                var existingRolePermissions = await _context.TblRolePermissions
                    .AsNoTracking()
                    .Where(rp => _context.TblUserRoles.Any(ur => ur.Id == rp.RoleId && ur.Role.ToLower() == role.ToLower()))
                    .Select(rp => rp.PermissionId)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                foreach (var permId in existingRolePermissions)
                {
                    userRole.TblRolePermissions.Add(new TblRolePermission
                    {
                        PermissionId = permId
                    });
                }

                _context.TblUserRoles.Add(userRole);
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _permissionService.InvalidateUserPermissions(user.UserId);

            var response = new StaffUserResponse
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                MobileNo = user.MobileNo,
                Roles = cleanRoles,
                CreatedAt = user.CreatedAt
            };

            return Result<StaffUserResponse>.Success(response, "User roles updated successfully.");
        }

        public async Task<Result> DeleteUserAsync(int userId, CancellationToken cancellationToken = default)
        {
            var user = await _context.TblUsers
                .Include(u => u.TblUserRoles)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.DeleteFlag != true, cancellationToken);

            if (user == null)
            {
                return Result.Failure("User not found.");
            }

            if (user.TblUserRoles.Any(r => string.Equals(r.Role, "owner", StringComparison.OrdinalIgnoreCase)))
            {
                return Result.Failure("The Owner account cannot be deleted.");
            }

            user.DeleteFlag = true;
            user.UpdatedAt = DateTime.UtcNow;

            // Invalidate user tokens
            var tokens = await _context.TblUserTokens
                .Where(t => t.UserId == userId && !t.Revoked)
                .ToListAsync(cancellationToken);

            foreach (var token in tokens)
            {
                token.Revoked = true;
            }

            await _context.SaveChangesAsync(cancellationToken);
            _permissionService.InvalidateUserPermissions(userId);

            return Result.Success("User deleted successfully.");
        }
    }
}
