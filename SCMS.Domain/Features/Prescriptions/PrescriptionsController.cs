using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Prescriptions.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Prescriptions
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrescriptionsController : ControllerBase
    {
        private readonly PrescriptionService _prescriptionService;

        public PrescriptionsController(PrescriptionService prescriptionService)
        {
            _prescriptionService = prescriptionService;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionRequest request)
        {
            var result = await _prescriptionService.CreatePrescriptionAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPrescriptionDetails(int id)
        {
            var result = await _prescriptionService.GetPrescriptionDetailsAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetPrescriptions([FromQuery] int? patientId, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetPrescriptionsAsync(patientId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("templates")]
        public async Task<IActionResult> SaveTemplate([FromBody] SaveTemplateRequest request)
        {
            var result = await _prescriptionService.SaveTemplateAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates([FromQuery] int? diseaseId, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _prescriptionService.GetTemplatesAsync(diseaseId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
