using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Shared;

namespace SCMS.Domain.Features.Diseases
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class DiseasesController : ControllerBase
    {
        private readonly DiseaseService _diseaseService;

        public DiseasesController(DiseaseService diseaseService)
        {
            _diseaseService = diseaseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetDiseases([FromQuery] string? query, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _diseaseService.GetDiseasesAsync(query, paginationRequest);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
