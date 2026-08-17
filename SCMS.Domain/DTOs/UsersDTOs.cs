using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.DTOs
{
    /// <summary>Represents a user / staff member with assigned roles.</summary>
    public sealed record StaffUserResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }

    /// <summary>Payload for creating a new staff user (e.g. Doctor, Staff, Admin).</summary>
    public sealed record CreateStaffUserRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [MaxLength(255, ErrorMessage = "Name cannot exceed 255 characters.")]
        public string Name { get; init; } = null!;

        public string? Email { get; init; }

        public string? MobileNo { get; init; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
        public string Password { get; init; } = null!;

        [Required(ErrorMessage = "At least one role is required.")]
        public List<string> Roles { get; init; } = new();
    }

    /// <summary>Payload for updating a user's assigned roles.</summary>
    public sealed record UpdateUserRolesRequest
    {
        [Required(ErrorMessage = "At least one role is required.")]
        public List<string> Roles { get; init; } = new();
    }
}
