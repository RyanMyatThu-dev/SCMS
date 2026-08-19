using System.ComponentModel.DataAnnotations;
using SCMS.Shared;

namespace SCMS.Domain.Features.Diseases.Models
{
    /// <summary>
    /// Request parameters for listing diseases with pagination.
    /// </summary>
    public class GetDiseasesRequest : PaginationRequest
    {
    }

    /// <summary>
    /// Response model for listing diseases.
    /// </summary>
    public sealed record GetDiseasesResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
    }

    /// <summary>
    /// Request parameters for searching diseases by keyword.
    /// </summary>
    public class SearchDiseasesRequest : PaginationRequest
    {
        [Required(ErrorMessage = "Search query is required.")]
        public string Query { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for disease search results.
    /// </summary>
    public sealed record SearchDiseasesResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
    }

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
    /// Response returned upon creating a disease record.
    /// </summary>
    public sealed record CreateDiseaseResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
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
    /// Response returned upon updating a disease record.
    /// </summary>
    public sealed record UpdateDiseaseResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
    }

    // Backward-compatibility alias
    public sealed record DiseaseResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
    }

    public class DiseaseRequest : PaginationRequest
    {
        public string? Query { get; set; }
    }
}
