using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Prescriptions
{
    public class PrescriptionTemplateResponse
    {
        public string Id { get; set; } = null!; // Guid or string identifier
        public string Name { get; set; } = null!;
        public int DiseaseId { get; set; }
        public string DiseaseName { get; set; } = null!;
        public List<TemplateItemResponseDto> Items { get; set; } = new();
    }

    public class TemplateItemResponseDto
    {
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string? Dosage { get; set; }
        public int Days { get; set; }
        public int Quantity { get; set; }
        public string? Instruction { get; set; }
    }
}
