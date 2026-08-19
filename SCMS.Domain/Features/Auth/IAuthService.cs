using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Auth.Models;

namespace SCMS.Domain.Features.Auth
{
    public interface IAuthService
    {
        Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
        Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
        Task<Result<AuthResponse>> RefreshAsync(RefreshTokenRequest request);
        Task<Result<LogoutResponse>> LogoutAsync(LogoutRequest request);
        Task<Result<CurrentUserResponse>> GetCurrentUserAsync(int userId);
    }
}
