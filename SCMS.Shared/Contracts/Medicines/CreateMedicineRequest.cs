using System.ComponentModel.DataAnnotations;

namespace SCMS.Shared.Contracts.Medicines
{
    public class CreateMedicineRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int? CategoryId { get; set; }

        [Range(0.0, double.MaxValue, ErrorMessage = "Unit price cannot be negative.")]
        public decimal UnitPrice { get; set; }
    }
}
