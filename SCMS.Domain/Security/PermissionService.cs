using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SCMS.Database.Models;

namespace SCMS.Domain.Security
{
    public class PermissionService : IPermissionService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKeyPrefix = "user_perms_";
        private const string CacheVersionKey = "perms_cache_version";

        public PermissionService(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        private long GetCacheVersion()
        {
            return _cache.GetOrCreate(CacheVersionKey, entry =>
            {
                entry.Priority = CacheItemPriority.NeverRemove;
                return DateTime.UtcNow.Ticks;
            });
        }

        public async Task<HashSet<string>> GetPermissionsForUserAsync(int userId, CancellationToken cancellationToken = default)
        {
            var version = GetCacheVersion();
            var cacheKey = $"{CacheKeyPrefix}{userId}_{version}";

            if (_cache.TryGetValue(cacheKey, out HashSet<string>? cachedPermissions) && cachedPermissions != null)
            {
                return cachedPermissions;
            }

            var userRoles = await _context.TblUserRoles
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .Select(r => new { r.Id, r.Role })
                .ToListAsync(cancellationToken);

            var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // If user is owner, grant all / wildcard
            if (userRoles.Any(r => string.Equals(r.Role.Trim(), "owner", StringComparison.OrdinalIgnoreCase)))
            {
                result.Add("*");
                _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
                return result;
            }

            if (userRoles.Count > 0)
            {
                var roleIds = userRoles.Select(r => r.Id).ToList();
                var roleNames = userRoles.Select(r => r.Role.Trim().ToLowerInvariant()).Distinct().ToList();

                // 1. Direct permissions mapped to this user's TblUserRole ids
                var directPermissions = await _context.TblRolePermissions
                    .AsNoTracking()
                    .Where(rp => roleIds.Contains(rp.RoleId))
                    .Select(rp => rp.Permission.Menu + "." + rp.Permission.Action)
                    .ToListAsync(cancellationToken);

                foreach (var p in directPermissions)
                {
                    result.Add(p);
                }

                // 2. Permissions mapped across all user roles matching the role names
                var roleSharedPermissions = await _context.TblRolePermissions
                    .AsNoTracking()
                    .Where(rp => _context.TblUserRoles.Any(ur => ur.Id == rp.RoleId && roleNames.Contains(ur.Role.ToLower())))
                    .Select(rp => rp.Permission.Menu + "." + rp.Permission.Action)
                    .ToListAsync(cancellationToken);

                foreach (var p in roleSharedPermissions)
                {
                    result.Add(p);
                }
            }

            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(15));
            return result;
        }

        public async Task<bool> HasPermissionAsync(int userId, string permission, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(permission))
            {
                return false;
            }

            var userPermissions = await GetPermissionsForUserAsync(userId, cancellationToken);
            return userPermissions.Contains("*") || userPermissions.Contains(permission);
        }

        public void InvalidateUserPermissions(int userId)
        {
            var version = GetCacheVersion();
            _cache.Remove($"{CacheKeyPrefix}{userId}_{version}");
        }

        public void InvalidateAll()
        {
            _cache.Set(CacheVersionKey, DateTime.UtcNow.Ticks);
        }
    }
}
