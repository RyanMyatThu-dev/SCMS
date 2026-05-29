using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SCMS.Shared;
using SCMS.Shared.Contracts.Mcp;

namespace SCMS.Domain.Features.Mcp
{
    [ApiController]
    [Route("api/mcp")]
    [Authorize(Roles = "admin,doctor")]
    public class McpController : ControllerBase
    {
        private readonly McpService _mcpService;
        private readonly IConfiguration _configuration;
        private static readonly HttpClient HttpClient = new();

        public McpController(McpService mcpService, IConfiguration configuration)
        {
            _mcpService = mcpService;
            _configuration = configuration;
        }

        [HttpGet("tools")]
        public IActionResult GetAvailableTools()
        {
            var tools = _mcpService.GetAvailableTools();
            return Ok(Result<List<McpToolDefinition>>.Success(tools));
        }

        [HttpPost("tools/call")]
        public async Task<IActionResult> CallToolAsync([FromBody] McpToolCallRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(Result<McpToolCallResponse>.Failure("Invalid tool call request. Tool name is required."));
            }

            var result = await _mcpService.CallToolAsync(request);

            if (result.IsFailure)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        [HttpPost("chat")]
        public async Task<IActionResult> ChatAsync([FromBody] AiChatRequest request)
        {
            if (request == null || request.Messages == null || request.Messages.Count == 0)
            {
                return BadRequest(Result<AiChatResponse>.Failure("Chat messages are required."));
            }

            // 1. Resolve Gemini API Key (support appsettings or env variable for robustness)
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "YOUR_GEMINI_API_KEY_HERE")
            {
                apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return BadRequest(Result<AiChatResponse>.Failure("Gemini API key is not configured. Please add Gemini:ApiKey to appsettings.json or set GEMINI_API_KEY environment variable."));
            }

            try
            {
                // 2. Prepare MCP tools in Gemini function calling format
                var rawTools = _mcpService.GetAvailableTools();
                var geminiTools = new List<GeminiTool>
                {
                    new()
                    {
                        FunctionDeclarations = rawTools.Select(t => new GeminiFunctionDeclaration
                        {
                            Name = t.Name,
                            Description = t.Description,
                            Parameters = ConvertSchema(t.InputSchema)
                        }).ToList()
                    }
                };

                // 3. Prepare System Prompt (low token usage & Myanmar language directive)
                var systemInstruction = new GeminiInstruction
                {
                    Parts = new List<GeminiPart>
                    {
                        new()
                        {
                            Text = "You are a helpful, secure clinic assistant for the Smart Clinic Management System (SCMS). " +
                                   "You have access to real-time clinic operations, EMR, and stock details through MCP tools. " +
                                   "Rules:\n" +
                                   "- Support commands and queries in both English and Myanmar language. Always reply in the user's preferred language.\n" +
                                   "- Keep answers concise, clear, and direct (low token usage focus).\n" +
                                   "- Always retrieve data using the provided MCP tools before answering. NEVER fabricate patient details, stock levels, or EMR data.\n" +
                                   "- Never diagnose patients or recommend prescription changes independently. Remind the user that clinical judgment belongs to the doctor."
                        }
                    }
                };

                // 4. Map chat history to Gemini structure
                var contents = new List<GeminiContent>();
                foreach (var msg in request.Messages)
                {
                    contents.Add(new GeminiContent
                    {
                        Role = string.Equals(msg.Role, "user", StringComparison.OrdinalIgnoreCase) ? "user" : "model",
                        Parts = new List<GeminiPart> { new() { Text = msg.Content } }
                    });
                }

                // 5. Run the Agentic Tool-Calling Loop (max 5 iterations to prevent infinite loops)
                string finalReply = "Sorry, I was unable to complete your request. Please try again.";
                int maxIterations = 5;

                for (int iter = 0; iter < maxIterations; iter++)
                {
                    var geminiReq = new GeminiGenerateRequest
                    {
                        Contents = contents,
                        SystemInstruction = systemInstruction,
                        Tools = geminiTools
                    };

                    var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";
                    var httpResponse = await HttpClient.PostAsJsonAsync(url, geminiReq);

                    if (!httpResponse.IsSuccessStatusCode)
                    {
                        var errContent = await httpResponse.Content.ReadAsStringAsync();
                        return BadRequest(Result<AiChatResponse>.Failure($"Gemini API request failed: {errContent}"));
                    }

                    var geminiRes = await httpResponse.Content.ReadFromJsonAsync<GeminiGenerateResponse>();
                    var candidate = geminiRes?.Candidates?.FirstOrDefault();
                    var modelContent = candidate?.Content;

                    if (modelContent == null || modelContent.Parts == null || modelContent.Parts.Count == 0)
                    {
                        break;
                    }

                    // Add the model's turn to our conversation history
                    contents.Add(modelContent);

                    // Check if the model wants to call functions
                    var functionCalls = modelContent.Parts.Where(p => p.FunctionCall != null).Select(p => p.FunctionCall!).ToList();

                    if (functionCalls.Count == 0)
                    {
                        // No function calls, this is the final natural language answer
                        finalReply = modelContent.Parts.FirstOrDefault(p => !string.IsNullOrEmpty(p.Text))?.Text ?? finalReply;
                        break;
                    }

                    // Execute tool calls and collect responses in a single turn
                    var toolResponseParts = new List<GeminiPart>();

                    foreach (var call in functionCalls)
                    {
                        var toolArgs = call.Args ?? new Dictionary<string, object>();
                        var localCallResult = await _mcpService.CallToolAsync(new McpToolCallRequest
                        {
                            Name = call.Name,
                            Arguments = toolArgs
                        });

                        object responseData;
                        if (localCallResult.IsSuccess && localCallResult.Data != null && localCallResult.Data.Content.Count > 0)
                        {
                            responseData = new { result = localCallResult.Data.Content[0].Text };
                        }
                        else
                        {
                            responseData = new { error = localCallResult.Message ?? "Execution failed." };
                        }

                        toolResponseParts.Add(new GeminiPart
                        {
                            FunctionResponse = new GeminiFunctionResponse
                            {
                                Name = call.Name,
                                Response = responseData
                            }
                        });
                    }

                    // Add the function responses back into the history under the 'user' role
                    contents.Add(new GeminiContent
                    {
                        Role = "user",
                        Parts = toolResponseParts
                    });
                }

                return Ok(Result<AiChatResponse>.Success(new AiChatResponse { Reply = finalReply }));
            }
            catch (Exception ex)
            {
                return BadRequest(Result<AiChatResponse>.Failure($"Internal error running AI assistant: {ex.Message}"));
            }
        }

        private static object ConvertSchema(object originalSchema)
        {
            try
            {
                // Adjust parameter schema naming to suit Gemini API if needed.
                // Gemini expects the type parameter in uppercase (e.g. "OBJECT", "STRING"),
                // so we do a quick replace in the serialized JSON to keep it fully compliant.
                var rawJson = JsonSerializer.Serialize(originalSchema);
                rawJson = rawJson
                    .Replace("\"type\":\"object\"", "\"type\":\"OBJECT\"")
                    .Replace("\"type\":\"string\"", "\"type\":\"STRING\"")
                    .Replace("\"type\":\"integer\"", "\"type\":\"INTEGER\"")
                    .Replace("\"type\":\"number\"", "\"type\":\"NUMBER\"")
                    .Replace("\"type\":\"boolean\"", "\"type\":\"BOOLEAN\"");

                return JsonSerializer.Deserialize<object>(rawJson) ?? originalSchema;
            }
            catch
            {
                return originalSchema;
            }
        }
    }

    #region Gemini API Mapping Classes
    public class GeminiGenerateRequest
    {
        [JsonPropertyName("contents")]
        public List<GeminiContent> Contents { get; set; } = new();

        [JsonPropertyName("systemInstruction")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiInstruction? SystemInstruction { get; set; }

        [JsonPropertyName("tools")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<GeminiTool>? Tools { get; set; }
    }

    public class GeminiContent
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Text { get; set; }

        [JsonPropertyName("functionCall")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiFunctionCall? FunctionCall { get; set; }

        [JsonPropertyName("functionResponse")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public GeminiFunctionResponse? FunctionResponse { get; set; }
    }

    public class GeminiInstruction
    {
        [JsonPropertyName("parts")]
        public List<GeminiPart> Parts { get; set; } = new();
    }

    public class GeminiTool
    {
        [JsonPropertyName("functionDeclarations")]
        public List<GeminiFunctionDeclaration> FunctionDeclarations { get; set; } = new();
    }

    public class GeminiFunctionDeclaration
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("parameters")]
        public object Parameters { get; set; } = new { type = "OBJECT", properties = new { } };
    }

    public class GeminiFunctionCall
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("args")]
        public Dictionary<string, object>? Args { get; set; }
    }

    public class GeminiFunctionResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("response")]
        public object Response { get; set; } = new { };
    }

    public class GeminiGenerateResponse
    {
        [JsonPropertyName("candidates")]
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")]
        public GeminiContent? Content { get; set; }
    }
    #endregion
}
