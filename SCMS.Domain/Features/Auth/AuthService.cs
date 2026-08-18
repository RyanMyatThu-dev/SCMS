using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Common;
using SCMS.Domain.Security;
using SCMS.Shared;
using SCMS.Domain.Features.Auth.Models;

namespace SCMS.Domain.Features.Auth
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly PasswordHashingService _passwords;
        private readonly JwtTokenFactory _tokens;

        public AuthService(AppDbContext context, PasswordHashingService passwords, JwtTokenFactory tokens)
        {
            _context = context;
            _passwords = passwords;
            _tokens = tokens;
        }

        public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result<AuthResponse>.Failure("Name is required.");
            }
            if (!ValidationHelper.IsValidEmail(request.Email, out var email))
            {
                return Result<AuthResponse>.Failure("A valid email address is required.");
            }
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return Result<AuthResponse>.Failure("Password must be at least 8 characters.");
            }

            string? mobile = null;
            if (!string.IsNullOrWhiteSpace(request.MobileNo))
            {
                if (!ValidationHelper.IsValidMyanmarMobile(request.MobileNo, out var normMobile))
                {
                    return Result<AuthResponse>.Failure("Invalid mobile number. Please provide a valid Myanmar mobile number (e.g. 09xxxxxxxxx or +959xxxxxxxxx).");
                }
                mobile = normMobile;
            }

            var exists = await _context.TblUsers.AnyAsync(u =>
                u.DeleteFlag != true &&
                (u.Email == email || (mobile != null && u.MobileNo == mobile)));

            if (exists)
            {
                return Result<AuthResponse>.Failure("An account with that email or mobile number already exists.");
            }

            var user = new TblUser
            {
                Name = request.Name.Trim(),
                Email = email,
                MobileNo = mobile,
                PasswordHash = _passwords.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            user.TblUserRoles.Add(new TblUserRole
            {
                Role = "user"
            });

            _context.TblUsers.Add(user);
            await _context.SaveChangesAsync();

            return await IssueTokensAsync(user, "Account created.");
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.EmailOrMobile) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Result<AuthResponse>.Failure("Email/mobile and password are required.");
            }

            var rawInput = request.EmailOrMobile.Trim();
            var loginLower = rawInput.ToLowerInvariant();
            string? normalizedMobile = null;
            if (ValidationHelper.IsValidMyanmarMobile(rawInput, out var norm))
            {
                normalizedMobile = norm;
            }

            var user = await _context.TblUsers
                .Include(u => u.TblUserRoles)
                .FirstOrDefaultAsync(u => u.DeleteFlag != true
                    && (u.Email == loginLower 
                        || u.MobileNo == rawInput 
                        || (normalizedMobile != null && u.MobileNo == normalizedMobile)));

            if (user == null || !_passwords.VerifyPassword(user.PasswordHash, request.Password))
            {
                return Result<AuthResponse>.Failure("Invalid credentials.");
            }

            return await IssueTokensAsync(user, "Login successful.");
        }

        public async Task<Result<AuthResponse>> RefreshAsync(RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return Result<AuthResponse>.Failure("Refresh token is required.");
            }

            var tokenHash = _tokens.HashToken(request.RefreshToken);
            var token = await _context.TblUserTokens
                .Include(t => t.User)
                .ThenInclude(u => u.TblUserRoles)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.Revoked && t.ExpiresAt > DateTime.UtcNow);

            if (token == null || token.User.DeleteFlag == true)
            {
                return Result<AuthResponse>.Failure("Refresh token is invalid or expired.");
            }

            token.Revoked = true;
            await _context.SaveChangesAsync();

            return await IssueTokensAsync(token.User, "Token refreshed.");
        }

        public async Task<Result> LogoutAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return Result.Success("Logged out.");
            }

            var tokenHash = _tokens.HashToken(refreshToken);
            var token = await _context.TblUserTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash && !t.Revoked);
            if (token != null)
            {
                token.Revoked = true;
                await _context.SaveChangesAsync();
            }

            return Result.Success("Logged out.");
        }

        public async Task<Result<CurrentUserResponse>> GetCurrentUserAsync(int userId)
        {
            var user = await _context.TblUsers
                .AsNoTracking()
                .Include(u => u.TblUserRoles)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.DeleteFlag != true);

            if (user == null)
            {
                return Result<CurrentUserResponse>.Failure("User not found.");
            }

            return Result<CurrentUserResponse>.Success(MapUser(user));
        }

        private async Task<Result<AuthResponse>> IssueTokensAsync(TblUser user, string message)
        {
            var roles = GetNormalizedRoles(user);
            var expiresAt = _tokens.AccessTokenExpiresAt;
            var accessToken = _tokens.CreateAccessToken(user.UserId, user.Name, user.Email, roles, expiresAt);
            var refreshToken = _tokens.CreateRefreshToken();

            _context.TblUserTokens.Add(new TblUserToken
            {
                UserId = user.UserId,
                TokenHash = _tokens.HashToken(refreshToken),
                ExpiresAt = _tokens.RefreshTokenExpiresAt,
                Revoked = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Result<AuthResponse>.Success(new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = expiresAt,
                User = MapUser(user, roles)
            }, message);
        }

        private static CurrentUserResponse MapUser(TblUser user, IReadOnlyCollection<string>? roles = null)
            => new()
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                MobileNo = user.MobileNo,
                Roles = (roles ?? GetNormalizedRoles(user)).ToList()
            };

        private static List<string> GetNormalizedRoles(TblUser user)
        {
            var roles = user.TblUserRoles
                .Select(r => r.Role.Trim().ToLowerInvariant())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Distinct()
                .ToList();

            return roles.Count == 0 ? new List<string> { "user" } : roles;
        }
    }
}
