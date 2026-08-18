using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.DTOs
{
    /// <summary>Represents a system permission.</summary>
    public sealed record PermissionResponse
    {
        public int Id { get; init; }
        public string Menu { get; init; } = null!;
        public string Action { get; init; } = null!;
        public string PermissionKey => $"{Menu}.{Action}";
    }

    /// <summary>Represents a role with its assigned permissions and active user count.</summary>
    public sealed record RoleResponse
    {
        public string RoleName { get; init; } = null!;
        public int UserCount { get; init; }
        public List<string> Permissions { get; init; } = new();
    }

    /// <summary>Payload for creating a new role.</summary>
    public sealed record CreateRoleRequest
    {
        [Required(ErrorMessage = "Role name is required.")]
        [MaxLength(50, ErrorMessage = "Role name cannot exceed 50 characters.")]
        public string RoleName { get; init; } = null!;

        public List<string>? Permissions { get; init; }
    }

    /// <summary>Payload for assigning permissions to a role.</summary>
    public sealed record AssignRolePermissionsRequest
    {
        [Required(ErrorMessage = "Permissions list is required.")]
        public List<string> Permissions { get; init; } = new();
    }

    /// <summary>Payload for granting or revoking a single permission to/from a role.</summary>
    public sealed record ModifyPermissionRequest
    {
        [Required(ErrorMessage = "Permission key is required.")]
        public string PermissionKey { get; init; } = null!;
    }
}
