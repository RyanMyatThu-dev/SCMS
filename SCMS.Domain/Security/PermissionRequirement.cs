using Microsoft.AspNetCore.Authorization;

namespace SCMS.Domain.Security
{
    public sealed class PermissionRequirement : IAuthorizationRequirement
    {
        public string Permission { get; }

        public PermissionRequirement(string permission)
        {
            Permission = permission;
        }
    }
}
