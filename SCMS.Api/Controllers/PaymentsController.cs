using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.Payments;
using SCMS.Domain.Features.Payments.Models;
using SCMS.Domain.Security;
using SCMS.Shared;

namespace SCMS.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IPdfDocumentService _pdfDocumentService;

        public PaymentsController(IPaymentService paymentService, IPdfDocumentService pdfDocumentService)
        {
            _paymentService = paymentService;
            _pdfDocumentService = pdfDocumentService;
        }

        /// <summary>Process automated payment gateway callback / webhook.</summary>
        [HttpPost("gateway-callback")]
        [HasPermission("Payments.Update")]
        [ProducesResponseType(typeof(Result<PaymentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ProcessGatewayCallback([FromBody] ProcessPaymentCallbackRequest request)
        {
            var result = await _paymentService.ProcessGatewayCallbackAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Submit screenshot proof for manual bank transfer or mobile wallet payment.</summary>
        [HttpPost("manual-proof")]
        [HasPermission("Payments.Create")]
        [ProducesResponseType(typeof(Result<PaymentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SubmitManualPaymentProof([FromBody] ManualPaymentProofRequest request)
        {
            var result = await _paymentService.SubmitManualPaymentProofAsync(request);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Approve pending payment transaction.</summary>
        [HttpPost("{id:int}/approve")]
        [HasPermission("Payments.Update")]
        [ProducesResponseType(typeof(Result<PaymentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ApprovePayment(int id)
        {
            var result = await _paymentService.ApprovePaymentAsync(id);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Query billing and payment transactions with status, date, and query filtering.</summary>
        [HttpGet]
        [HasPermission("Payments.View")]
        [ProducesResponseType(typeof(PagedResult<PaymentDetailsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetPayments(
            [FromQuery] string? status, 
            [FromQuery] PaginationRequest paginationRequest,
            [FromQuery] string? dateFilter = null,
            [FromQuery] string? query = null)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _paymentService.GetPaymentsAsync(status, paginationRequest, dateFilter, query);
            return result.IsFailure ? BadRequest(result) : Ok(result);
        }

        /// <summary>Generate and download printable PDF invoice.</summary>
        [HttpGet("{id:int}/invoice/pdf")]
        [HasPermission("Payments.ExportPdf")]
        [Produces("application/pdf")]
        public async Task<IActionResult> GetInvoicePdf(int id)
        {
            var result = await _paymentService.GetPaymentByIdAsync(id);
            if (result.IsFailure || result.Data == null)
            {
                return BadRequest(result);
            }

            var bytes = _pdfDocumentService.CreateInvoicePdf(result.Data);
            return File(bytes, "application/pdf", $"invoice-{id}.pdf");
        }
    }
}
