using System.Collections.Generic;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Mcp.Models;

namespace SCMS.Domain.Features.Mcp
{
    public interface IMcpService
    {
        List<McpToolDefinition> GetAvailableTools();
        Task<Result<McpToolCallResponse>> CallToolAsync(McpToolCallRequest request);
    }
}
