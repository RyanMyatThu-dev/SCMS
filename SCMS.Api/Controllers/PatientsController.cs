using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Patients;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PatientsController : ControllerBase
    {
        private readonly IPatientService _patientService;
        private readonly IPdfDocumentService _pdfDocumentService;

        public PatientsController(IPatientService patientService, IPdfDocumentService pdfDocumentService)
        {
            _patientService = patientService;
            _pdfDocumentService = pdfDocumentService;
        }

        /// <summary>Create or link a patient medical profile for a user.</summary>
        [HttpPost]
        [HasPermission("Patients.Create")]
        [ProducesResponseType(typeof(Result<CreatePatientProfileResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> AddPatientProfile([FromBody] CreatePatientProfileRequest request)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.AddPatientProfileAsync(request, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>List patient profiles with pagination.</summary>
        [HttpGet]
        [HasPermission("Patients.View")]
        [ProducesResponseType(typeof(PagedResult<GetPatientProfilesResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetPatientProfiles([FromQuery] GetPatientProfilesRequest request)
        {
            request ??= new GetPatientProfilesRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.GetPatientProfilesAsync(request, userId.Value, User.IsStaff());
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Search patient profiles with keyword query and pagination.</summary>
        [HttpGet("search")]
        [HasPermission("Patients.View")]
        [ProducesResponseType(typeof(PagedResult<SearchPatientProfilesResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SearchPatientProfiles([FromQuery] SearchPatientProfilesRequest request)
        {
            request ??= new SearchPatientProfilesRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.SearchPatientProfilesAsync(request, userId.Value, User.IsStaff());
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Get patient profile by patient ID.</summary>
        [HttpGet("patients/{id:int}")]
        [HasPermission("Patients.View")]
        [ProducesResponseType(typeof(Result<GetPatientProfileByIdResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetPatientProfileById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.GetPatientProfileByIdAsync(id, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Retrieve full medical, diagnosis, and visit timeline for a patient.</summary>
        [HttpGet("{id:int}/history")]
        [HasPermission("Patients.View")]
        [ProducesResponseType(typeof(Result<PatientHistoryResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetPatientHistory(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.GetPatientHistoryAsync(id, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Retrieve comprehensive medical and clinical summary for a patient.</summary>
        [HttpGet("{id:int}/summary")]
        [HasPermission("Patients.View")]
        [ProducesResponseType(typeof(Result<MedicalSummaryResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMedicalSummary(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.GetMedicalSummaryAsync(id, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Export HTML formatted patient medical summary report.</summary>
        [HttpGet("{id:int}/summary/html")]
        [HasPermission("Patients.View")]
        [Produces("text/html")]
        public async Task<IActionResult> GetMedicalSummaryHtml(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var html = await _patientService.GenerateMedicalSummaryHtmlAsync(id, userId.Value);
            return Content(html, "text/html");
        }

        /// <summary>Export PDF downloadable patient medical summary document.</summary>
        [HttpGet("{id:int}/summary/pdf")]
        [HasPermission("Patients.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetMedicalSummaryPdf(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.GetMedicalSummaryAsync(id, userId.Value);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateMedicalSummaryPdf(result.Data);
            return File(bytes, "application/pdf", $"medical-summary-{id}.pdf");
        }

        /// <summary>Soft-delete a patient profile.</summary>
        [HttpDelete("{id:int}")]
        [HasPermission("Patients.Delete")]
        [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> DeletePatientProfile(int id)
        {
            if (id <= 0)
            {
                return BadRequest(Result.Failure("Invalid patient ID."));
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(Result.Failure("User id is required."));
            }

            var result = await _patientService.DeletePatientProfileAsync(id, userId.Value);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }
    }
}
