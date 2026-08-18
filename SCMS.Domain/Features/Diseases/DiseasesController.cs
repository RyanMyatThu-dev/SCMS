using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.DTOs;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Domain.Features.Diseases
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class DiseasesController : ControllerBase
    {
        private readonly IDiseaseService _diseaseService;

        public DiseasesController(IDiseaseService diseaseService)
        {
            _diseaseService = diseaseService;
        }

        [HttpGet]
        [HasPermission("Diseases.View")]
        public async Task<IActionResult> GetDiseases([FromQuery] DiseaseRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Result<DiseaseResponse>.Failure("Invalid request data."));
            }
            request ??= new DiseaseRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var result = await _diseaseService.GetDiseasesAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost]
        [HasPermission("Diseases.Create")]
        public async Task<IActionResult> CreateDisease([FromBody] CreateDiseaseRequest request)
        {
            if (!ModelState.IsValid) { 
                return BadRequest(Result<DiseaseResponse>.Failure("Invalid request data."));
            }
            var result = await _diseaseService.CreateDiseaseAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut]
        [HasPermission("Diseases.Update")]
        public async Task<IActionResult> UpdateDisease([FromBody] UpdateDiseaseRequest request)
        {
            if (!ModelState.IsValid) { 
                return BadRequest(Result<DiseaseResponse>.Failure("Invalid request data."));
            }
            var result = await _diseaseService.UpdateDiseaseAsync(request);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id}")]
        [HasPermission("Diseases.Delete")]
        public async Task<IActionResult> DeactivateDisease(int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(Result<bool>.Failure("Invalid request data."));
            }
            var result = await _diseaseService.DeactivateDiseaseAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
