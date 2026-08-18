using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;
using SCMS.Shared.Contracts.Photo;

namespace SCMS.Domain.Features.Photo
{
    public interface IPhotoService
    {
        Task<Result<PhotoUploadResult>> UploadPhotoAsync(IFormFile file);
        Task<Result<PhotoUploadResult>> UploadPhotoFromBytesAsync(byte[] imageBytes, string fileName);
        Task<Result> DeletePhotoAsync(string publicId);
    }
}
