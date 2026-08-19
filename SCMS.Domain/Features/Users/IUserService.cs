using System.Threading;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Users.Models;

namespace SCMS.Domain.Features.Users
{
    public interface IUserService
    {
        Task<PagedResult<GetUsersResponse>> GetUsersAsync(GetUsersRequest request, CancellationToken cancellationToken = default);
        Task<PagedResult<SearchUsersResponse>> SearchUsersAsync(SearchUsersRequest request, CancellationToken cancellationToken = default);
        Task<Result<GetUserByIdResponse>> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default);
        Task<Result<CreateStaffUserResponse>> CreateStaffUserAsync(CreateStaffUserRequest request, CancellationToken cancellationToken = default);
        Task<Result<UpdateUserRolesResponse>> UpdateUserRolesAsync(int userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default);
        Task<Result> DeleteUserAsync(int userId, CancellationToken cancellationToken = default);
    }
}
