using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace SCMS.Domain.Features.Auth.Models
{
    /// <summary>
    /// Payload for registering a new user / patient account.
    /// </summary>
    public sealed record RegisterRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        public required string Name { get; init; }

        public string? MobileNo { get; init; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public required string Email { get; init; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
        public required string Password { get; init; }
    }

    /// <summary>
    /// Payload for logging into the application.
    /// </summary>
    public sealed record LoginRequest
    {
        [Required(ErrorMessage = "Email or mobile number is required.")]
        public required string EmailOrMobile { get; init; }

        [Required(ErrorMessage = "Password is required.")]
        public required string Password { get; init; }
    }

    /// <summary>
    /// Payload for refreshing an expired access token.
    /// </summary>
    public sealed record RefreshTokenRequest
    {
        [Required(ErrorMessage = "Refresh token is required.")]
        public required string RefreshToken { get; init; }
    }

    /// <summary>
    /// Payload for logging out and revoking a refresh token.
    /// </summary>
    public sealed record LogoutRequest
    {
        public string? RefreshToken { get; init; }
    }

    /// <summary>
    /// Response returned upon successful logout.
    /// </summary>
    public sealed record LogoutResponse
    {
        public bool LoggedOut { get; init; } = true;
        public string Message { get; init; } = "Logged out successfully.";
    }

    /// <summary>
    /// Authentication token response returned upon login/registration.
    /// </summary>
    public sealed record AuthResponse
    {
        public string AccessToken { get; init; } = null!;
        public string RefreshToken { get; init; } = null!;
        public DateTime ExpiresAt { get; init; }
        public CurrentUserResponse User { get; init; } = new();
    }

    /// <summary>
    /// Details of the currently authenticated user.
    /// </summary>
    public sealed record CurrentUserResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();

        public bool IsStaff => Roles.Any(r => string.Equals(r, "owner", StringComparison.OrdinalIgnoreCase)
            || string.Equals(r, "admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(r, "doctor", StringComparison.OrdinalIgnoreCase));
    }
}
