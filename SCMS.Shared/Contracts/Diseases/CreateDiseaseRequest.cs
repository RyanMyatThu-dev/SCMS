namespace SCMS.Shared.Contracts.Diseases
{
    public class CreateDiseaseRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}