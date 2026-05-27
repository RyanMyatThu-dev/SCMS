using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SCMS.Domain.Features.Payments.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Payments
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentsController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("gateway-callback")]
        public async Task<IActionResult> ProcessGatewayCallback([FromBody] ProcessPaymentCallbackRequest request)
        {
            var result = await _paymentService.ProcessGatewayCallbackAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("manual-proof")]
        public async Task<IActionResult> SubmitManualPaymentProof([FromBody] ManualPaymentProofRequest request)
        {
            var result = await _paymentService.SubmitManualPaymentProofAsync(request);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("{id:int}/approve")]
        public async Task<IActionResult> ApprovePayment(int id)
        {
            var result = await _paymentService.ApprovePaymentAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetPayments([FromQuery] string? status, [FromQuery] PaginationRequest paginationRequest)
        {
            paginationRequest ??= new PaginationRequest();
            if (paginationRequest.PageNumber <= 0) paginationRequest.PageNumber = 1;
            if (paginationRequest.PageSize <= 0) paginationRequest.PageSize = 10;

            var result = await _paymentService.GetPaymentsAsync(status, paginationRequest);
            if (result.IsFailure)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
