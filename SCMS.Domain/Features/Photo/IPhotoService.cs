using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;

namespace SCMS.Domain.Features.Photo
{
    public interface IPhotoService
    {
        Task<Result<PhotoUploadResult>> UploadPhotoAsync(IFormFile file);
        Task<Result> DeletePhotoAsync(string publicId);
    }

    public sealed record PhotoUploadResult
    {
        public string PublicId { get; init; } = null!;
        public string Url { get; init; } = null!;
    }
}
