using System.Threading;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Dashboards.Models;

namespace SCMS.Domain.Features.Dashboards
{
    public interface IDashboardService
    {
        Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync(string period = "daily", CancellationToken cancellationToken = default);
        Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId, CancellationToken cancellationToken = default);
    }
}
