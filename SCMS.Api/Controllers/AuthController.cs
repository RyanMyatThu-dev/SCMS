using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Auth;
using SCMS.Domain.Features.Auth.Models;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>Register a new patient user.</summary>
        [AllowAnonymous]
        [HttpPost("register")]
        [ProducesResponseType(typeof(Result<AuthResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await _authService.RegisterAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Authenticate user with email/password credentials.</summary>
        [AllowAnonymous]
        [HttpPost("login")]
        [ProducesResponseType(typeof(Result<AuthResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);
            return result.IsSuccess ? Ok(result) : Unauthorized(result);
        }

        /// <summary>Obtain a new access token using a refresh token.</summary>
        [AllowAnonymous]
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(Result<AuthResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
        {
            var result = await _authService.RefreshAsync(request);
            return result.IsSuccess ? Ok(result) : Unauthorized(result);
        }

        /// <summary>Log out and invalidate session tokens.</summary>
        [AllowAnonymous]
        [HttpPost("logout")]
        [ProducesResponseType(typeof(Result<LogoutResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            request ??= new LogoutRequest();
            var result = await _authService.LogoutAsync(request);
            return Ok(result);
        }
    }
}
