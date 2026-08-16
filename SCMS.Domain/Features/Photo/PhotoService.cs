using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using SCMS.Shared;

namespace SCMS.Domain.Features.Photo
{
    public class PhotoService
    {
        private readonly Cloudinary? _cloudinary;
        private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
        private static readonly string[] AllowedContentTypes = { "image/jpeg", "image/png", "image/webp", "image/jpg" };
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

        public PhotoService(Cloudinary? cloudinary = null)
        {
            _cloudinary = cloudinary;
        }

        public async Task<Result<PhotoUploadResult>> UploadPhotoAsync(IFormFile file)
        {
            if (_cloudinary == null)
            {
                return Result<PhotoUploadResult>.Failure("Cloudinary photo service is not configured.");
            }

            if (file == null || file.Length == 0)
            {
                return Result<PhotoUploadResult>.Failure("No file was uploaded.");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                return Result<PhotoUploadResult>.Failure("File size exceeds the maximum allowed limit of 5 MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension) || (!string.IsNullOrEmpty(file.ContentType) && !AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant())))
            {
                return Result<PhotoUploadResult>.Failure("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
            }

            try
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "scms/medicines",
                    Transformation = new Transformation().Width(500).Height(500).Crop("limit")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    return Result<PhotoUploadResult>.Failure($"Cloudinary upload error: {uploadResult.Error.Message}");
                }

                var result = new PhotoUploadResult
                {
                    PublicId = uploadResult.PublicId,
                    Url = uploadResult.SecureUrl.ToString()
                };

                return Result<PhotoUploadResult>.Success(result, "Photo uploaded successfully.");
            }
            catch (Exception ex)
            {
                return Result<PhotoUploadResult>.Failure($"Failed to upload photo: {ex.Message}");
            }
        }

        public async Task<Result> DeletePhotoAsync(string publicId)
        {
            if (_cloudinary == null)
            {
                return Result.Failure("Cloudinary photo service is not configured.");
            }

            if (string.IsNullOrWhiteSpace(publicId))
            {
                return Result.Success("No photo to delete."); // Treat empty as success to simplify flow
            }

            try
            {
                var deleteParams = new DeletionParams(publicId);
                var deleteResult = await _cloudinary.DestroyAsync(deleteParams);

                if (deleteResult.Error != null)
                {
                    return Result.Failure($"Cloudinary delete error: {deleteResult.Error.Message}");
                }

                if (deleteResult.Result == "ok" || deleteResult.Result == "not_found")
                {
                    return Result.Success("Photo deleted successfully.");
                }

                return Result.Failure($"Failed to delete photo. Cloudinary status: {deleteResult.Result}");
            }
            catch (Exception ex)
            {
                return Result.Failure($"Failed to delete photo: {ex.Message}");
            }
        }
    }

    public class PhotoUploadResult
    {
        public string PublicId { get; set; } = null!;
        public string Url { get; set; } = null!;
    }
}
