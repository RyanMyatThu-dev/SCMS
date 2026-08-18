using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Diseases.Models
{
    /// <summary>
    /// Payload for creating a new disease diagnosis entry.
    /// </summary>
    public sealed record CreateDiseaseRequest
    {
        [Required(ErrorMessage = "Disease name is required.")]
        public required string Name { get; init; }

        public string? Description { get; init; }
    }

    /// <summary>
    /// Payload for updating an existing disease diagnosis entry.
    /// </summary>
    public sealed record UpdateDiseaseRequest
    {
        [Required(ErrorMessage = "Disease ID is required.")]
        public required int Id { get; init; }

        [Required(ErrorMessage = "Disease name is required.")]
        public required string Name { get; init; }

        public string? Description { get; init; }
    }

    /// <summary>
    /// Disease / diagnosis detail response.
    /// </summary>
    public sealed record DiseaseResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
    }

    /// <summary>
    /// Request parameters for querying diseases.
    /// </summary>
    public class DiseaseRequest : PaginationRequest
    {
        public string? Query { get; set; }
    }
}
