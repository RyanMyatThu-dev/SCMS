using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Patients
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly PatientService _patientService;

        public PatientsController(PatientService patientService)
        {
            _patientService = patientService;
        }

        private int GetUserId()
        {
            if (Request.Headers.TryGetValue("X-User-Id", out var headerValue) && int.TryParse(headerValue, out var headerUserId))
            {
                return headerUserId;
            }
            if (Request.Query.TryGetValue("userId", out var queryValue) && int.TryParse(queryValue, out var queryUserId))
            {
                return queryUserId;
            }
            return 1; // Demo fallback
        }

        [HttpPost]
        public async Task<IActionResult> AddPatientProfile([FromBody] PatientProfileRequest request)
        {
            var userId = GetUserId();
            var result = await _patientService.AddPatientProfileAsync(request, userId);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetPatientProfiles([FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var userId = GetUserId();
            var result = await _patientService.GetPatientProfilesAsync(userId, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPatientProfileById(int id)
        {
            var result = await _patientService.GetPatientProfileByIdAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}/history")]
        public async Task<IActionResult> GetPatientHistory(int id)
        {
            var result = await _patientService.GetPatientHistoryAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}/summary")]
        public async Task<IActionResult> GetMedicalSummary(int id)
        {
            var result = await _patientService.GetMedicalSummaryAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id:int}/summary/html")]
        public async Task<IActionResult> GetMedicalSummaryHtml(int id)
        {
            var html = await _patientService.GenerateMedicalSummaryHtmlAsync(id);
            return Content(html, "text/html");
        }
    }
}
