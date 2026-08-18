using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Users.Models;

namespace SCMS.Domain.Features.Users
{
    public interface IUserService
    {
        Task<Result<List<StaffUserResponse>>> GetUsersAsync(string? roleFilter = null, string? search = null, CancellationToken cancellationToken = default);
        Task<Result<StaffUserResponse>> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default);
        Task<Result<StaffUserResponse>> CreateStaffUserAsync(CreateStaffUserRequest request, CancellationToken cancellationToken = default);
        Task<Result<StaffUserResponse>> UpdateUserRolesAsync(int userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default);
        Task<Result> DeleteUserAsync(int userId, CancellationToken cancellationToken = default);
    }
}
