using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace SCMS.Domain.Security
{
    public sealed class JwtTokenFactory
    {
        private readonly IConfiguration _configuration;

        public JwtTokenFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public DateTime AccessTokenExpiresAt => DateTime.UtcNow.AddMinutes(GetAccessTokenMinutes());

        public string CreateAccessToken(int userId, string name, string? email, IReadOnlyCollection<string> roles, DateTime expiresAt)
        {
            var roleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
            var now = DateTimeOffset.UtcNow;
            var payload = new Dictionary<string, object?>
            {
                ["iss"] = Issuer,
                ["aud"] = Audience,
                ["sub"] = userId.ToString(),
                ["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] = userId.ToString(),
                ["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] = name,
                ["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] = email,
                [roleClaimType] = roles,
                ["iat"] = now.ToUnixTimeSeconds(),
                ["nbf"] = now.ToUnixTimeSeconds(),
                ["exp"] = new DateTimeOffset(expiresAt).ToUnixTimeSeconds()
            };

            var header = new Dictionary<string, object?>
            {
                ["alg"] = "HS256",
                ["typ"] = "JWT"
            };

            var encodedHeader = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(header, JsonOptions));
            var encodedPayload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions));
            var signingInput = $"{encodedHeader}.{encodedPayload}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SigningKey));
            var signature = Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(signingInput)));
            return $"{signingInput}.{signature}";
        }

        public string CreateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(48);
            return Base64UrlEncode(bytes);
        }

        public string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }

        public DateTime RefreshTokenExpiresAt => DateTime.UtcNow.AddDays(GetRefreshTokenDays());

        public string Issuer => _configuration["Jwt:Issuer"] ?? "SCMS.Api";

        public string Audience => _configuration["Jwt:Audience"] ?? "SCMS.Web";

        public string SigningKey => _configuration["Jwt:SigningKey"] ?? "SCMS development signing key - replace outside local development";

        private int GetAccessTokenMinutes()
            => int.TryParse(_configuration["Jwt:AccessTokenMinutes"], out var value) ? value : 60;

        private int GetRefreshTokenDays()
            => int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var value) ? value : 7;

        private static string Base64UrlEncode(byte[] bytes)
            => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };
    }
}
