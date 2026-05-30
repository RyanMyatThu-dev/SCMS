using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Components.Authorization;

namespace SCMS.Web.Services
{
    public class ScmsAuthenticationStateProvider : AuthenticationStateProvider
    {
        private readonly TokenStore _tokenStore;

        public ScmsAuthenticationStateProvider(TokenStore tokenStore)
        {
            _tokenStore = tokenStore;
        }

        public override async Task<AuthenticationState> GetAuthenticationStateAsync()
        {
            var token = await _tokenStore.GetAccessTokenAsync();
            if (string.IsNullOrWhiteSpace(token))
            {
                return Anonymous();
            }

            try
            {
                var claims = ParseClaims(token).ToList();
                var exp = claims.FirstOrDefault(c => c.Type == "exp")?.Value;
                if (long.TryParse(exp, out var expSeconds) && DateTimeOffset.FromUnixTimeSeconds(expSeconds) <= DateTimeOffset.UtcNow)
                {
                    return Anonymous();
                }

                return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt")));
            }
            catch
            {
                return Anonymous();
            }
        }

        public void NotifyAuthenticationChanged()
            => NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());

        private static AuthenticationState Anonymous()
            => new(new ClaimsPrincipal(new ClaimsIdentity()));

        private static IEnumerable<Claim> ParseClaims(string jwt)
        {
            var payload = jwt.Split('.')[1];
            var jsonBytes = ParseBase64WithoutPadding(payload);
            using var document = JsonDocument.Parse(jsonBytes);

            foreach (var property in document.RootElement.EnumerateObject())
            {
                if (property.Value.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in property.Value.EnumerateArray())
                    {
                        yield return new Claim(property.Name, item.GetString() ?? string.Empty);
                    }
                }
                else
                {
                    yield return new Claim(property.Name, property.Value.ToString());
                }
            }
        }

        private static byte[] ParseBase64WithoutPadding(string base64)
        {
            base64 = base64.Replace('-', '+').Replace('_', '/');
            return Convert.FromBase64String(base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '='));
        }
    }
}
