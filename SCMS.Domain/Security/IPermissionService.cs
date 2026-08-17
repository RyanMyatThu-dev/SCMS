namespace SCMS.Domain.Security
{
    public interface IPermissionService
    {
        Task<HashSet<string>> GetPermissionsForUserAsync(int userId, CancellationToken cancellationToken = default);
        Task<bool> HasPermissionAsync(int userId, string permission, CancellationToken cancellationToken = default);
        void InvalidateUserPermissions(int userId);
        void InvalidateAll();
    }
}
