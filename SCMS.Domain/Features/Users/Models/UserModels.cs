using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Users.Models
{
    /// <summary>Request parameters for listing users with pagination and optional role filtering.</summary>
    public class GetUsersRequest : PaginationRequest
    {
        public string? Role { get; set; }
    }

    /// <summary>Response item for user listing.</summary>
    public sealed record GetUsersResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }

    /// <summary>Request parameters for searching users by keyword with pagination.</summary>
    public class SearchUsersRequest : PaginationRequest
    {
        [Required(ErrorMessage = "Search query is required.")]
        public string Query { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    /// <summary>Response item for user search results.</summary>
    public sealed record SearchUsersResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }

    /// <summary>Response item for user by ID query.</summary>
    public sealed record GetUserByIdResponse
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
        public required string Name { get; init; }

        public string? Email { get; init; }

        public string? MobileNo { get; init; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
        public required string Password { get; init; }

        [Required(ErrorMessage = "At least one role is required.")]
        public List<string> Roles { get; init; } = new();
    }

    /// <summary>Response returned upon creating a new staff user.</summary>
    public sealed record CreateStaffUserResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }

    /// <summary>Payload for updating a user's assigned roles.</summary>
    public sealed record UpdateUserRolesRequest
    {
        [Required(ErrorMessage = "At least one role is required.")]
        public List<string> Roles { get; init; } = new();
    }

    /// <summary>Response returned upon updating a user's assigned roles.</summary>
    public sealed record UpdateUserRolesResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }

    // Backward-compatibility record
    public sealed record StaffUserResponse
    {
        public int UserId { get; init; }
        public string Name { get; init; } = null!;
        public string? Email { get; init; }
        public string? MobileNo { get; init; }
        public List<string> Roles { get; init; } = new();
        public DateTime? CreatedAt { get; init; }
    }
}
