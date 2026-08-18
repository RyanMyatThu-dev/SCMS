using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Mcp;

namespace SCMS.Domain.Features.Mcp
{
    public interface IMcpService
    {
        Task<Result<IEnumerable<McpToolDefinition>>> GetToolsAsync();
        Task<Result<McpToolExecutionResponse>> ExecuteToolAsync(McpToolExecutionRequest request);
    }
}
