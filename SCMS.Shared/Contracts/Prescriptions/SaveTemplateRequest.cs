using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Prescriptions
{
    public class SaveTemplateRequest
    {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public int DiseaseId { get; set; }
        public List<TemplateItemDto> Items { get; set; } = new();
    }

    public class TemplateItemDto
    {
        public int MedicineId { get; set; }
        public string? Dosage { get; set; }
        public int Days { get; set; }
        public int Quantity { get; set; }
        public string? Instruction { get; set; }
    }
}
