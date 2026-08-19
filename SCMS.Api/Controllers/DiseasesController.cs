using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Diseases;
using SCMS.Domain.Features.Diseases.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class DiseasesController : ControllerBase
    {
        private readonly IDiseaseService _diseaseService;

        public DiseasesController(IDiseaseService diseaseService)
        {
            _diseaseService = diseaseService;
        }

        /// <summary>List diseases with pagination.</summary>
        [HttpGet]
        [HasPermission("Diseases.View")]
        [ProducesResponseType(typeof(PagedResult<GetDiseasesResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetDiseases([FromQuery] GetDiseasesRequest request)
        {
            request ??= new GetDiseasesRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var result = await _diseaseService.GetDiseasesAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Search diseases with keyword query and pagination.</summary>
        [HttpGet("search")]
        [HasPermission("Diseases.View")]
        [ProducesResponseType(typeof(PagedResult<SearchDiseasesResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SearchDiseases([FromQuery] SearchDiseasesRequest request)
        {
            request ??= new SearchDiseasesRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var result = await _diseaseService.SearchDiseasesAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Create a new disease diagnosis record.</summary>
        [HttpPost]
        [HasPermission("Diseases.Create")]
        [ProducesResponseType(typeof(Result<CreateDiseaseResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateDisease([FromBody] CreateDiseaseRequest request)
        {
            var result = await _diseaseService.CreateDiseaseAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Update an existing disease diagnosis record.</summary>
        [HttpPut]
        [HasPermission("Diseases.Update")]
        [ProducesResponseType(typeof(Result<UpdateDiseaseResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateDisease([FromBody] UpdateDiseaseRequest request)
        {
            var result = await _diseaseService.UpdateDiseaseAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>Deactivate/soft-delete a disease record.</summary>
        [HttpDelete("{id:int}")]
        [HasPermission("Diseases.Delete")]
        [ProducesResponseType(typeof(Result<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeactivateDisease(int id)
        {
            var result = await _diseaseService.DeactivateDiseaseAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
