using System.Threading;
using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Domain.Features.Dashboards.Models;

namespace SCMS.Domain.Features.Dashboards
{
    /// <summary>
    /// Service interface for clinic dashboards and analytics.
    /// </summary>
    public interface IDashboardService
    {
        /// <summary>
        /// Retrieves doctor/owner dashboard metrics including monthly, weekly, and daily breakdowns.
        /// </summary>
        Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync(GetDoctorDashboardRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Backward-compatible overload for string period.
        /// </summary>
        Task<Result<DoctorDashboardResponse>> GetDoctorDashboardAsync(string period = "daily", CancellationToken cancellationToken = default);

        /// <summary>
        /// Retrieves patient personal dashboard metrics.
        /// </summary>
        Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId, CancellationToken cancellationToken = default);
    }
}
