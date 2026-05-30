using System.Security.Claims;

namespace SCMS.Domain.Security
{
    public static class CurrentUserExtensions
    {
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub");
            return int.TryParse(raw, out var userId) ? userId : null;
        }

        public static bool IsStaff(this ClaimsPrincipal user)
            => user.IsInRole("owner")
                || user.IsInRole("admin")
                || user.IsInRole("doctor");
    }
}
