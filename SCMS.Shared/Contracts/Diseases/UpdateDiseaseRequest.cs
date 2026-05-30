namespace SCMS.Shared.Contracts.Diseases
{
    public class UpdateDiseaseRequest
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}