using Microsoft.JSInterop;
using SCMS.Shared.Contracts.Auth;

namespace SCMS.Web.Services
{
    public class TokenStore
    {
        private const string AccessTokenKey = "scms.accessToken";
        private const string RefreshTokenKey = "scms.refreshToken";
        private const string UserNameKey = "scms.userName";
        private readonly IJSRuntime _js;

        public TokenStore(IJSRuntime js)
        {
            _js = js;
        }

        public ValueTask<string?> GetAccessTokenAsync()
            => _js.InvokeAsync<string?>("localStorage.getItem", AccessTokenKey);

        public ValueTask<string?> GetRefreshTokenAsync()
            => _js.InvokeAsync<string?>("localStorage.getItem", RefreshTokenKey);

        public ValueTask<string?> GetUserNameAsync()
            => _js.InvokeAsync<string?>("localStorage.getItem", UserNameKey);

        public async Task SaveAsync(AuthResponse response)
        {
            await _js.InvokeVoidAsync("localStorage.setItem", AccessTokenKey, response.AccessToken);
            await _js.InvokeVoidAsync("localStorage.setItem", RefreshTokenKey, response.RefreshToken);
            await _js.InvokeVoidAsync("localStorage.setItem", UserNameKey, response.User.Name);
        }

        public async Task ClearAsync()
        {
            await _js.InvokeVoidAsync("localStorage.removeItem", AccessTokenKey);
            await _js.InvokeVoidAsync("localStorage.removeItem", RefreshTokenKey);
            await _js.InvokeVoidAsync("localStorage.removeItem", UserNameKey);
        }
    }
}
